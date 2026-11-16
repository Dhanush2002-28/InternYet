import { classStatusTone, formatDate, formatTime, isUpcoming } from "../utils/format";

export default function ClassCard({ classItem, showMentor = true }) {
  const upcoming = isUpcoming(classItem);
  return (
    <div className="class-card">
      <div className="class-card-top">
        <h4>{classItem.title}</h4>
        <span className={`badge badge-${classStatusTone(classItem.status)}`}>
          {classItem.status}
        </span>
      </div>
      <p className="class-meta">
        <span>{formatDate(classItem.date)}</span>
        <span>·</span>
        <span>{formatTime(classItem.time)}</span>
        {showMentor && classItem.mentorName && (
          <>
            <span>·</span>
            <span>{classItem.mentorName}</span>
          </>
        )}
      </p>
      {classItem.description && <p className="class-desc">{classItem.description}</p>}
      {classItem.meetUrl && (
        <a
          className="btn btn-primary btn-sm"
          href={classItem.meetUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {upcoming ? "Join on Google Meet" : "Open Google Meet"}
        </a>
      )}
    </div>
  );
}