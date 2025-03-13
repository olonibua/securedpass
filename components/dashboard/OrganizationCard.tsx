'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Organization } from "@/types";
import { formatDate } from "@/lib/utils";
interface OrganizationCardProps {
  organization: Organization;
  role?: 'owner' | 'member';
}

export default function OrganizationCard({ organization, role = 'owner' }: OrganizationCardProps) {
  const router = useRouter();
  
  const handleClick = () => {
    if (role === 'owner') {
      router.push(`/dashboard/${organization.$id}`);
    } else {
      router.push(`/member-portal/${organization.$id}`);
    }
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span className="truncate">{organization.name}</span>
          {role === 'member' && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Member
            </span>
          )}
          {role === 'owner' && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Owner
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {organization.description || "No description provided"}
        </p>
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 mr-1" />
          <span>Created: {formatDate(organization.createdAt)}</span>
        </div>
        {role === 'owner' && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            <span>{organization.memberCount || 0} members</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={handleClick}>
          {role === 'owner' ? 'Manage' : 'View'} 
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
}
