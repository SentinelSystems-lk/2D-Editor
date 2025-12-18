function Toolbar(){
    return(
        <div style={{
        height: "50px",
        background: "#2a2a2a",
        borderBottom: "1px solid #3a3a3a",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "0 16px",
      }}>
            <span>rectangle </span>
            <span>circle</span>
        </div>
    );
}

export default Toolbar;