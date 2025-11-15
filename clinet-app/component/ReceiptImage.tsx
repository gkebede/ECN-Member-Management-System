import { useParams } from "react-router-dom";
import { useStore } from "../src/app/stores/store";
import { observer } from "mobx-react-lite";
import { Typography } from "@mui/material";

const ReceiptImage = observer(() => {
  const { memberStore } = useStore();
  const { selectedMember, memberRegistry } = memberStore;
  const { fileId } = useParams<{ fileId: string }>();


  let file;

// Search in the selected member first
file = selectedMember?.memberFiles?.find(f => f.id === fileId);

console.log("Looking for fileId:", file);

// If not found, search in all members
if (!file) {
  for (const member of memberRegistry.values()) {
    file = member.memberFiles?.find(f => f.id === fileId);
    if (file) break;
  }
}

if (!file || !file.base64FileData) {
  return <div style={{ padding: 20 }}>No image found.</div>;
}


// Determine proper MIME type
const mimeType =
  file.fileType ||
  (file.fileName?.endsWith(".jpg") ? "image/jpeg" :
  file.fileName?.endsWith(".jpeg") ? "image/jpeg" :
  file.fileName?.endsWith(".png") ? "image/png" :
  "application/octet-stream"); // fallback

 

return (
  <div style={{ textAlign: "center", padding: 20 }}>
    <h3>Receipt Image</h3>
  <img
  src={
    file.base64FileData.startsWith("data:") 
      ? file.base64FileData  // already has prefix
      : `data:${mimeType};base64,${file.base64FileData}` // prepend if raw
  }
  alt={file.fileName || "Receipt"}
  style={{ maxWidth: "90%", height: "auto", border: "1px solid #ccc", borderRadius: 8 }}
/>

 <Typography mb={1} variant="h6">
          <strong>Email:</strong> {file.email}
        </Typography>
        <Typography mb={1} variant="h6">
          <strong>Phone:</strong>  
        </Typography>
  </div>
);
})

export default ReceiptImage;
