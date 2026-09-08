import { useState } from "react";
import { Upload } from "lucide-react";
import api from "../api/axios";
import { Modal, Alert, Spinner } from "./ui";
import Dropzone from "./Dropzone";
import { shortDate } from "../utils/format";

const ACCEPT = ["pdf", "docx", "pptx", "xlsx", "zip", "txt", "csv"];

export default function AssignmentSubmitModal({ assignment, open, onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!assignment) return null;

  const resubmit = !!assignment.submission;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!file) return setError("Choose the file you want to submit.");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post(`/assignments/${assignment._id}/submit`, fd);
      onDone?.(data.data);
      setFile(null);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={resubmit ? "Replace submission" : "Submit assignment"}
      description={`${assignment.title} · due ${shortDate(assignment.dueDate)}`}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        {resubmit && (
          <Alert type="info">
            You already submitted <b>{assignment.submission.fileName}</b>. Uploading a new file
            replaces it.
          </Alert>
        )}
        <Dropzone value={file} onChange={setFile} accept={ACCEPT} maxSizeMB={15} />
        <div className="flex justify-end gap-2.5 pt-1">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : <><Upload className="h-4 w-4" /> Submit</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}
