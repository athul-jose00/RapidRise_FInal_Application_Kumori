import StandardFilesTabPage from "./StandardFilesTabPage";

export default function StarredTabPage({ onCreateNew, fileListProps }) {
  return (
    <StandardFilesTabPage
      title="Starred"
      description="Browse your workspace."
      onCreateNew={onCreateNew}
      fileListProps={fileListProps}
    />
  );
}
