import { useEffect, useState } from "react";
import { getClasses } from "../../data/store";
import ClassCard from "../../components/ClassCard";
import EmptyState from "../../components/EmptyState";
import { FullPageLoader } from "../../components/FullPageLoader";
import { sortClassesDesc } from "../../utils/format";

export default function StudentClasses() {
  const [classes, setClasses] = useState(null);

  useEffect(() => {
    let active = true;
    getClasses()
      .then((items) => {
        if (active) setClasses(sortClassesDesc(items));
      })
      .catch(() => {
        if (active) setClasses([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (classes === null) return <FullPageLoader label="Loading classes…" />;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">My classes</h1>
          <p className="page-sub">
            Live sessions scheduled by your mentor. Join from here using Google Meet.
          </p>
        </div>
      </div>
      {classes.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No classes scheduled yet"
            hint="When your mentor schedules a class it will appear here with a join link."
          />
        </div>
      ) : (
        <div className="grid grid-2">
          {classes.map((item) => (
            <ClassCard key={item.id} classItem={item} />
          ))}
        </div>
      )}
    </div>
  );
}