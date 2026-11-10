import {requirePermissionSession} from "@/lib/auth";
import {AppShell} from "@/components/app-shell";
import {StaffAccess} from "@/components/staff-access";
export const dynamic="force-dynamic";
export default async function StaffAccessPage(){
 const session=await requirePermissionSession("permissions.manage");
 return <AppShell session={session}><div className="eyebrow">Staff workspace / Access control</div><h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Panel staff access</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Choose which members can use staff tools and what they are allowed to do. Panel permissions are managed separately from Discord server roles.</p><StaffAccess/></AppShell>;
}
