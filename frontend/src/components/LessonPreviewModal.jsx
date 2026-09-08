import { Download } from "lucide-react";
import { Modal } from "./ui";
import DocumentViewer from "./DocumentViewer";
import { downloadLesson } from "../utils/lessonFiles";

export default function LessonPreviewModal({ lesson, open, onClose }) {
  if (!lesson) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lesson.title}
      description={lesson.description || undefined}
      wide
    >
      <div className="space-y-4">
        <DocumentViewer lesson={lesson} height="65vh" />
        <div className="flex justify-end">
          <button className="btn-primary" onClick={() => downloadLesson(lesson._id, lesson.fileName)}>
            <Download className="h-4 w-4" /> Download
          </button>
        </div>
      </div>
    </Modal>
  );
}
