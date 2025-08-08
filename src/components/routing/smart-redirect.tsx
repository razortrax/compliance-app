"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export function SmartRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [hasRedirected, setHasRedirected] = useState(false);

  const userRole = searchParams.get("role");

  useEffect(() => {
    const handleSmartRouting = async () => {
      // Only run once per user session and when user is loaded
      if (!isLoaded || !user || hasRedirected) return;

      // Don't redirect if user is already on master, organization, or other authenticated pages
      const currentPath = window.location.pathname;
      if (
        currentPath.includes("/master/") ||
        currentPath.includes("/organization/") ||
        currentPath.includes("/consultant/") ||
        currentPath.includes("/complete-profile") ||
        currentPath.includes("/drivers/") ||
        currentPath.includes("/equipment/") ||
        currentPath.includes("/licenses/") ||
        currentPath.includes("/training/")
      ) {
        console.log("🔄 User already on authenticated page, skipping redirect:", currentPath);
        setHasRedirected(true);
        return;
      }

      // Check for manual navigation bypass flag in sessionStorage
      const manualNavigation = sessionStorage.getItem("manual_navigation_bypass");
      if (manualNavigation) {
        console.log("🚨 Manual navigation bypass detected - SmartRedirect disabled");
        sessionStorage.removeItem("manual_navigation_bypass");
        setHasRedirected(true);
        return;
      }

      try {
        // If this is a new user signup with role parameter, handle differently
        if (userRole) {
          // This is from signup - let existing logic handle it
          return;
        }

        // Check if user has an existing role (for returning users)
        const roleResponse = await fetch("/api/user/role");
        if (!roleResponse.ok) return;

        const { role } = await roleResponse.json();
        console.log("🔍 SmartRedirect - User role:", role);

        // Get profile data for master org ID
        const profileResponse = await fetch("/api/user/profile");
        let profileData = null;
        if (profileResponse.ok) {
          profileData = await profileResponse.json();
          console.log("🔍 SmartRedirect - Profile data:", profileData);

          // If we have a master organization, redirect directly
          if (profileData.masterOrganization?.id) {
            console.log("🔄 Direct redirect to master dashboard");
            router.push(`/master/${profileData.masterOrganization.id}`);
            setHasRedirected(true);
            return;
          }
        } else {
          console.log("🔍 SmartRedirect - Profile API failed, skipping auto-redirect");
          // Don't redirect if profile API fails - let user navigate manually
          setHasRedirected(true);
          return;
        }

        // Smart redirect based on existing user role
        switch (role.roleType) {
          case "master":
            console.log("🔄 Redirecting master user to master dashboard");
            // Only redirect if we have valid profile data
            if (profileData?.masterOrganization?.id) {
              router.push(`/master/${profileData.masterOrganization.id}`);
              setHasRedirected(true);
            } else {
              console.log("🔍 Master user missing organization data - staying on current page");
              setHasRedirected(true);
            }
            break;

          case "organization":
            // For organization users, we need to find their master organization
            const orgProfileResponse = await fetch("/api/user/profile");
            if (orgProfileResponse.ok) {
              const { masterOrganization } = await orgProfileResponse.json();
              if (masterOrganization?.id && role.organizationId) {
                console.log("🔄 Redirecting org user to their organization");
                router.push(`/master/${masterOrganization.id}/organization/${role.organizationId}`);
                setHasRedirected(true);
              } else {
                console.log("🔄 Org user missing master org - staying on current page");
                // Don't redirect to complete-profile, let user stay where they are
                setHasRedirected(true);
              }
            }
            break;

          case "location":
            // For location users, we need to find their specific location
            const locProfileResponse = await fetch("/api/user/profile");
            if (locProfileResponse.ok) {
              const { masterOrganization } = await locProfileResponse.json();
              if (masterOrganization?.id && role.organizationId) {
                console.log("🔄 Redirecting location user to their organization");
                router.push(`/master/${masterOrganization.id}/organization/${role.organizationId}`);
                setHasRedirected(true);
              } else {
                console.log("🔄 Location user missing master org - staying on current page");
                // Don't redirect to complete-profile, let user stay where they are
                setHasRedirected(true);
              }
            }
            break;

          case "consultant":
            console.log("🔄 Redirecting consultant to dashboard");
            router.push("/consultant/dashboard");
            setHasRedirected(true);
            break;

          case "new_user":
            // User needs to complete profile - redirect to complete-profile
            console.log("🔄 Redirecting new user to complete profile");
            router.push("/complete-profile?role=organization");
            setHasRedirected(true);
            break;

          default:
            // Unknown role or no role - stay on current page
            console.log("🔄 User role unknown, staying on current page");
            break;
        }
      } catch (error) {
        console.error("Smart routing error:", error);
        // On error, stay on current page
      }
    };

    // Small delay to ensure user data is loaded
    const timer = setTimeout(handleSmartRouting, 1000);
    return () => clearTimeout(timer);
  }, [user, isLoaded, userRole, router, hasRedirected]);

  return null; // This component doesn't render anything
}
