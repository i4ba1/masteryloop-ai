export default function Loading() {
  return (
    <main id="main" className="error-page" aria-busy="true">
      <p className="eyebrow" role="status">
        Opening your learning space...
      </p>
      <div className="loading-bar" />
    </main>
  );
}
