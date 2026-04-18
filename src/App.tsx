import { useState } from "react";

function App() {
  const [step, setStep] = useState(1);

  const [objectif, setObjectif] = useState("");
  const [age, setAge] = useState("");
  const [poids, setPoids] = useState("");
  const [taille, setTaille] = useState("");
  const [niveau, setNiveau] = useState("");
  const [budget, setBudget] = useState("");

  const pageStyle = {
minHeight: "100vh",
display: "flex",
justifyContent: "center",
alignItems: "center",
};

  const cardStyle = {
    background: "white",
    padding: 30,
    borderRadius: 20,
    width: 320,
    textAlign: "center",
   
  };

  const inputStyle = {
    width: "100%",
    padding: 10,
    marginTop: 10,
    borderRadius: 10,
    border: "1px solid #ddd",
  };

  const buttonStyle = {
    marginTop: 20,
    padding: 12,
    width: "100%",
    borderRadius: 20,
    border: "none",
    background: "#ff6b6b",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {step === 1 && (
          <>
            <h2>Bienvenue 👋</h2>
            <p>Ton objectif ?</p>

            <input
              style={inputStyle}
              placeholder="Perdre du poids / se tonifier..."
              value={objectif}
              onChange={(e) => setObjectif(e.target.value)}
            />

            <button style={buttonStyle} onClick={() => setStep(2)}>
              Continuer
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Ton profil</h2>

            <input
              style={inputStyle}
              type="number"
              placeholder="Ton âge"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />

            <input
              style={inputStyle}
              type="number"
              placeholder="Ton poids (kg)"
              value={poids}
              onChange={(e) => setPoids(e.target.value)}
            />

            <input
              style={inputStyle}
              type="number"
              placeholder="Ta taille (cm)"
              value={taille}
              onChange={(e) => setTaille(e.target.value)}
            />

            <button style={buttonStyle} onClick={() => setStep(3)}>
              Continuer
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Ton niveau</h2>

            <input
              style={inputStyle}
              placeholder="Débutant / moyen / avancé"
              value={niveau}
              onChange={(e) => setNiveau(e.target.value)}
            />

            <input
              style={inputStyle}
              type="number"
              placeholder="Ton budget alimentaire (€ / semaine)"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />

            <button style={buttonStyle} onClick={() => setStep(4)}>
              Voir mon plan
            </button>
          </>
        )}

        {step === 4 && (
          <>
            <h2>Ton plan personnalisé 🎯</h2>

            <p><b>Objectif :</b> {objectif}</p>
            <p><b>Âge :</b> {age}</p>
            <p><b>Poids :</b> {poids} kg</p>
            <p><b>Taille :</b> {taille} cm</p>
            <p><b>Niveau :</b> {niveau}</p>
            <p><b>Budget :</b> {budget} €</p>

            <button style={buttonStyle} onClick={() => setStep(1)}>
              Recommencer
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
