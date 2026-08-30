import { AnnouncementManagement } from "@/components/features/admin/announcements/AnnouncementManagement";

export const metadata = {
  title: "Announcements | Admin Dashboard",
  description: "Manage dashboard popup announcements for users",
};

export default function AdminAnnouncementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground text-sm">
          Create, publish, and manage dashboard popup announcements.
        </p>
      </div>
      <AnnouncementManagement />
    </div>
  );
}
