import React from "react";
import { DropzoneArea } from "material-ui-dropzone";

export default function MyFileUploader(props) {
  return (
    <DropzoneArea
      onChange={files => props.setparentfiles(files)}
      filesLimit={1}
      acceptedFiles={[".xml", ".hdbcalculationview"]}
    />
  );
}
