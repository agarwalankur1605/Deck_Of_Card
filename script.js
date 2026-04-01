let deckId = "";

const loader = document.getElementById("loader");
const container = document.getElementById("cards-container");
const remainingText = document.getElementById("remaining");

async function createDeck() {
  const res = await fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1");
  const data = await res.json();

  deckId = data.deck_id;
  remainingText.innerText = `Remaining Cards: ${data.remaining}`;
}

async function drawCards() {
  try {
    loader.style.display = "block";

    const res = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=5`);
    const data = await res.json();

    loader.style.display = "none";

    container.innerHTML = "";

    data.cards.forEach(card => {
      const div = document.createElement("div");
      div.classList.add("card");

      div.innerHTML = `
        <img src="${card.image}" />
        <p>${card.value} of ${card.suit}</p>
      `;

      container.appendChild(div);

    displayCards(data.cards);
    });

    remainingText.innerText = `Remaining Cards: ${data.remaining}`;

  } catch (err) {
    loader.innerText = "Error fetching cards ❌";
  }
}

async function shuffleDeck() {
  await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/shuffle/`);
  remainingText.innerText = "Deck shuffled!";
}

function displayCards(cards) {
  container.innerHTML = "";

  cards.forEach((card, index) => {
    const div = document.createElement("div");
    div.classList.add("card");

    div.style.animationDelay = `${index * 0.2}s`;

    div.innerHTML = `<img src="${card.image}" />`;

    container.appendChild(div);
  });
}

createDeck();


