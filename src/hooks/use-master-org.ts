import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

interface MasterOrg {
  id: string;
  name: string;
}

export function useMasterOrg() {
  const { user, isLoaded } = useUser();
  const [masterOrg, setMasterOrg] = useState<MasterOrg | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMasterOrg = async () => {
      if (!isLoaded || !user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/organizations");
        if (response.ok) {
          const organizations = await response.json();

          // Find the master organization (the one owned by this user)
          const masterOrganization = organizations.find(
            (org: any) => org.party?.userId === user.id,
          );

          if (masterOrganization) {
            setMasterOrg({
              id: masterOrganization.id,
              name: masterOrganization.name,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching master organization:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMasterOrg();
  }, [user, isLoaded]);

  return { masterOrg, loading };
}
