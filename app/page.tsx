export default function HomePage() {
  return (
    <main style={{
      padding: "40px",
      fontFamily: "Arial",
    }}>
      <h1>?? CBT SaaS System Ready</h1>

      <div style={{
        marginTop: "30px",
        display: "flex",
        gap: "20px",
        flexWrap: "wrap"
      }}>
        <a href="/dashboard">Dashboard</a>
        <a href="/admin">Admin</a>
        <a href="/exam">Exam</a>
      </div>
    </main>
  );
}
