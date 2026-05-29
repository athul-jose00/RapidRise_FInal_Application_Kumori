import StandardFilesTabPage from "./StandardFilesTabPage";

export default function MyFilesTabPage({ onCreateNew, fileListProps }) {
  return (
    <StandardFilesTabPage
      title="My Files"
      description="Manage and organize all your uploaded files."
      onCreateNew={onCreateNew}
      fileListProps={fileListProps}
    />
  );
}
