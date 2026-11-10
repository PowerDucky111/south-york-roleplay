import { NextRequest, NextResponse } from "next/server";
import { isBootstrapAdmin, requirePermissionApi } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { getMember, getMembers } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermissionApi("permissions.manage");
  if ("response" in auth) return auth.response;
  try {
    const db = getDatabase();
    const [roles, assignments, members] = await Promise.all([
      db.prepare("SELECT id, name, description FROM panel_roles ORDER BY name").all<{id:string;name:string;description:string}>(),
      db.prepare("SELECT discord_user_id, role_id FROM panel_user_roles").all<{discord_user_id:string;role_id:string}>(),
      getMembers(),
    ]);
    const assigned = new Map<string,string[]>();
    for (const row of assignments.results) assigned.set(row.discord_user_id,[...(assigned.get(row.discord_user_id)??[]),row.role_id]);
    return NextResponse.json({
      roles: roles.results,
      members: members.filter(m=>m.user).map(m=>({id:m.user!.id,username:m.user!.username,displayName:m.nick||m.user!.global_name||m.user!.username,roleIds:assigned.get(m.user!.id)??[]})),
      canAssignElevatedRoles:isBootstrapAdmin(auth.session.userId),
    });
  } catch(error) {
    console.error("[staff access] GET failed:",error);
    return NextResponse.json({error:"Could not load panel staff access. Check the D1 migration and Discord bot connection."},{status:500});
  }
}

export async function PATCH(request:NextRequest) {
  const auth=await requirePermissionApi("permissions.manage");
  if("response" in auth) return auth.response;
  const origin=request.headers.get("origin");
  if(origin && origin!==request.nextUrl.origin) return NextResponse.json({error:"Invalid request origin."},{status:403});
  let body:{userId?:unknown;roleIds?:unknown};
  try { body=await request.json(); } catch { return NextResponse.json({error:"Invalid request body."},{status:400}); }
  if(typeof body.userId!=="string" || !/^\d{17,20}$/.test(body.userId) || !Array.isArray(body.roleIds) || body.roleIds.length>10 || !body.roleIds.every(id=>typeof id==="string"&&id.length<=80)) {
    return NextResponse.json({error:"Choose a valid Discord member and panel roles."},{status:400});
  }
  const roleIds=[...new Set(body.roleIds as string[])];
  if(roleIds.some(id=>id==="administrator"||id==="senior-management")&&!isBootstrapAdmin(auth.session.userId)) {
    return NextResponse.json({error:"Only the configured project owner can assign Administrator or Senior Management access."},{status:403});
  }
  try {
    const member=await getMember(body.userId);
    if(!member.user) return NextResponse.json({error:"Discord member could not be verified."},{status:404});
    const db=getDatabase();
    if(roleIds.length) {
      const placeholders=roleIds.map(()=>"?").join(",");
      const found=await db.prepare(`SELECT id FROM panel_roles WHERE id IN (${placeholders})`).bind(...roleIds).all<{id:string}>();
      if(found.results.length!==roleIds.length) return NextResponse.json({error:"One or more selected panel roles do not exist."},{status:400});
    }
    await db.prepare("INSERT INTO panel_users (discord_user_id,username,avatar_hash) VALUES (?,?,?) ON CONFLICT(discord_user_id) DO UPDATE SET username=excluded.username,avatar_hash=excluded.avatar_hash,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')").bind(member.user.id,member.user.global_name??member.user.username,member.user.avatar).run();
    await db.prepare("DELETE FROM panel_user_roles WHERE discord_user_id=?").bind(member.user.id).run();
    for(const roleId of roleIds) await db.prepare("INSERT INTO panel_user_roles (discord_user_id,role_id,assigned_by) VALUES (?,?,?)").bind(member.user.id,roleId,auth.session.userId).run();
    await db.prepare("INSERT INTO audit_logs (id,actor_discord_id,action,target_type,target_id,metadata_json) VALUES (?,?,'panel.roles.updated','panel_user',?,?)").bind(crypto.randomUUID(),auth.session.userId,member.user.id,JSON.stringify({roleIds})).run();
    return NextResponse.json({success:true});
  } catch(error) {
    console.error("[staff access] PATCH failed:",error);
    return NextResponse.json({error:"Could not update this member's panel access."},{status:500});
  }
}
