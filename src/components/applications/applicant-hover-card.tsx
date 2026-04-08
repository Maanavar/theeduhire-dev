"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Mail, MapPin, BookOpen } from "lucide-react";

interface ApplicantHoverCardProps {
  applicant: {
    name: string;
    email: string;
    phone: string | null;
    teacherProfile: {
      qualification?: string | null;
      experience?: string | null;
      city?: string | null;
      subjects?: string[] | null;
    } | null;
  };
  trigger: React.ReactNode;
}

export function ApplicantHoverCard({ applicant, trigger }: ApplicantHoverCardProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; above: boolean }>({
    top: 0,
    left: 0,
    above: false,
  });

  const handleMouseEnter = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const cardHeight = 240; // approximate height
    const above = spaceBelow < cardHeight;

    setPosition({
      top: above
        ? rect.top - cardHeight - 8 // above the trigger
        : rect.bottom + 8, // below the trigger
      left: Math.max(
        12,
        Math.min(rect.left, window.innerWidth - 320 - 12) // max-width ~320px with padding
      ),
      above,
    });

    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const subjects = applicant.teacherProfile?.subjects || [];
  const subjectsDisplay = subjects.slice(0, 3).join(", ");

  return (
    <>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {trigger}
      </div>

      {/* Portal for hover card */}
      {isOpen &&
        createPortal(
          <div
            className="fixed z-50 pointer-events-none"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="card p-4 w-72 shadow-xl border-black/[0.09] pointer-events-auto">
              {/* Name */}
              <h3 className="text-sm font-semibold text-gray-900">{applicant.name}</h3>

              {/* City */}
              {applicant.teacherProfile?.city && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-600">
                  <MapPin className="w-3.5 h-3.5" />
                  {applicant.teacherProfile.city}
                </div>
              )}

              <div className="my-3 h-px bg-gray-100" />

              {/* Qualification */}
              {applicant.teacherProfile?.qualification && (
                <div className="mb-2.5">
                  <p className="text-xs font-medium text-gray-700">Qualification</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {applicant.teacherProfile.qualification}
                  </p>
                </div>
              )}

              {/* Experience */}
              {applicant.teacherProfile?.experience && (
                <div className="mb-2.5">
                  <p className="text-xs font-medium text-gray-700">Experience</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {applicant.teacherProfile.experience}
                  </p>
                </div>
              )}

              {/* Subjects */}
              {subjectsDisplay && (
                <div className="mb-2.5">
                  <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    Subjects
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{subjectsDisplay}</p>
                  {subjects.length > 3 && (
                    <p className="text-xs text-gray-500 mt-1">
                      +{subjects.length - 3} more
                    </p>
                  )}
                </div>
              )}

              <div className="my-3 h-px bg-gray-100" />

              {/* Email */}
              <a
                href={`mailto:${applicant.email}`}
                className="flex items-center gap-2 text-xs text-brand-600 hover:text-brand-700 truncate"
              >
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{applicant.email}</span>
              </a>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
