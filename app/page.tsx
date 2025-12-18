import Link from "next/link";

function landingPage(){

  return(
  <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      textAlign: "center"
    }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>
        🎨 2D Editor
      </h1>
      <p style={{ fontSize: "1.2rem", marginBottom: "2rem", opacity: 0.9 }}>
        A simple 2D modeling tool
      </p>
      <Link href="/editor">
        <button style={{
          padding: "16px 32px",
          fontSize: "18px",
          background: "white",
          color: "#667eea",
          fontWeight: "600"
        }}>
          Open Editor
        </button>
      </Link>
    </div>

  );
}

export default landingPage;