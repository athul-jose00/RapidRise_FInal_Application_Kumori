import StandardFilesTabPage from "./StandardFilesTabPage";

export default function TrashTabPage({ onCreateNew, fileListProps }) {
  return (
    <StandardFilesTabPage
      title="Trash"
      description="Files here can be restored within 15 days before permanent deletion."
      onCreateNew={onCreateNew}
      fileListProps={fileListProps}
    />
  );
}
