"use client"; // Required for usePathname in Next.js App Router

import { usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"; // Adjust import path as needed

// Helper function to capitalize and format segment names
function formatSegment(segment: string): string {
  if (!segment) return "";
  // Replace hyphens/underscores with spaces and capitalize words
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function BreadcrumbClient() {
  const pathname = usePathname();

  // Return null or a loading state if pathname isn't available yet
  if (!pathname) {
    return null;
  }

  // Split the pathname into segments, filtering out empty strings from leading/trailing slashes
  const segments = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb className="flex items-center justify-center">
      {" "}
      {/* Example: hide on mobile */}
      <BreadcrumbList>
        {/* Always add the "Home" link */}
        <BreadcrumbItem>
          {pathname === "/" ? (
            <BreadcrumbPage>Home</BreadcrumbPage> // If we are on the home page
          ) : (
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {/* Map over the path segments to generate breadcrumb items */}
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          // Construct the path for the link up to the current segment
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const formattedSegment = formatSegment(segment);

          // Don't render if segment is empty after formatting (edge case)
          if (!formattedSegment) return null;

          return (
            // Use React.Fragment to group Separator and Item without adding extra DOM nodes
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  // Last item is the current page
                  <BreadcrumbPage>{formattedSegment}</BreadcrumbPage>
                ) : (
                  // Intermediate items are links
                  <BreadcrumbLink asChild>
                    <Link href={href}>{formattedSegment}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
