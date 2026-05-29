import StandardFilesTabPage from "./StandardFilesTabPage";

export default function RecentTabPage({ onCreateNew, fileListProps }) {
  return (
    <StandardFilesTabPage
      title="Recent"
      description="Browse your workspace."
      onCreateNew={onCreateNew}
      fileListProps={fileListProps}
    />
  );
}
