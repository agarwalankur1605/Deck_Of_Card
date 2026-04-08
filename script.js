let deckId    = "";
let handHistory = [];  
let handCounter = 0;

const VALUE_ORDER = ["2","3","4","5","6","7","8","9","10","JACK","QUEEN","KING","ACE"];

const HAND_RANKS = {
  ROYAL_FLUSH:     { name: "👑 Royal Flush",       desc: "A K Q J 10 — same suit",        tier: "tier-royal", rank: 1  },
  STRAIGHT_FLUSH:  { name: "🌟 Straight Flush",    desc: "Five in sequence, same suit",    tier: "tier-royal", rank: 2  },
  FOUR_OF_A_KIND:  { name: "💎 Four of a Kind",    desc: "Four cards of the same value",   tier: "tier-great", rank: 3  },
  FULL_HOUSE:      { name: "🏠 Full House",         desc: "Three of a kind + a pair",       tier: "tier-great", rank: 4  },
  FLUSH:           { name: "♠ Flush",              desc: "Five cards, same suit",           tier: "tier-good",  rank: 5  },
  STRAIGHT:        { name: "➡ Straight",           desc: "Five consecutive values",         tier: "tier-good",  rank: 6  },
  THREE_OF_A_KIND: { name: "🎯 Three of a Kind",   desc: "Three cards of the same value",  tier: "tier-fair",  rank: 7  },
  TWO_PAIR:        { name: "✌ Two Pair",           desc: "Two different pairs",             tier: "tier-fair",  rank: 8  },
  ONE_PAIR:        { name: "🤝 One Pair",           desc: "Two cards of the same value",    tier: "tier-low",   rank: 9  },
  HIGH_CARD:       { name: "🃏 High Card",          desc: "No matching cards",              tier: "tier-low",   rank: 10 },
};

const loader        = document.getElementById("loader");
const container     = document.getElementById("cards-container");
const remainingText = document.getElementById("remaining");
const handResult    = document.getElementById("hand-result");
const historyList   = document.getElementById("history-list");

async function createDeck() {
  try {
    const res  = await fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1");
    const data = await res.json();
    deckId = data.deck_id;
    remainingText.innerText = `${data.remaining} cards remaining`;
  } catch {
    remainingText.innerText = "Failed to load deck.";
  }
}

async function drawCards() {
  try {
    loader.style.display = "block";
    handResult.style.display = "none";

    const res  = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=5`);
    const data = await res.json();
    loader.style.display = "none";

    if (!data.cards || data.cards.length < 5) {
      loader.style.display = "block";
      loader.innerText = "Not enough cards — click New Deck!";
      return;
    }

    renderCurrentHand(data.cards);

    const handKey = evaluateHand(data.cards);
    displayHandBanner(handKey);

    handCounter++;
    handHistory.unshift({
      id: handCounter,
      cards: data.cards,
      handKey,
      timestamp: new Date()
    });

    applyHistoryFilters();

    remainingText.innerText = `${data.remaining} cards remaining`;

    highlightRanking(handKey);

  } catch (err) {
    loader.style.display = "block";
    loader.innerText = "Error dealing cards ❌";
  }
}

async function shuffleDeck() {
  container.innerHTML = "";
  handResult.style.display = "none";
  loader.style.display = "block";
  loader.innerText = "Shuffling new deck...";

  await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/shuffle/`);

  loader.style.display = "none";
  loader.innerText = "Dealing...";
  remainingText.innerText = "52 cards remaining";

  document.querySelectorAll(".rank-item").forEach(el => el.classList.remove("rank-active"));
}

function renderCurrentHand(cards) {
  container.innerHTML = "";

  cards.forEach((card, i) => {
    const div = document.createElement("div");
    div.classList.add("card");
    div.style.animationDelay = `${i * 0.1}s`;
    div.innerHTML = `<img src="${card.image}" alt="${card.value} of ${card.suit}"/>`;
    container.appendChild(div);
  });
}

function evaluateHand(cards) {
  const valueMap = {
    "ACE":13,"KING":12,"QUEEN":11,"JACK":10,
    "10":9,"9":8,"8":7,"7":6,"6":5,"5":4,"4":3,"3":2,"2":1
  };

  const values = cards.map(c => valueMap[c.value]).sort((a, b) => a - b);
  const suits  = cards.map(c => c.suit);

  const valueCounts = values.reduce((acc, v) => {
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});

  const freqs = Object.values(valueCounts).sort((a, b) => b - a);

  const isFlush      = suits.every(s => s === suits[0]);
  const isSequential = values.every((v, i) => i === 0 || v === values[i - 1] + 1);
  const isAceLow     = JSON.stringify(values) === JSON.stringify([1, 2, 3, 4, 13]);
  const isStraight   = isSequential || isAceLow;
  const isRoyal      = isFlush && isSequential && values[4] === 13 && values[0] === 9;

  if (isRoyal)                               return "ROYAL_FLUSH";
  if (isFlush && isStraight)                 return "STRAIGHT_FLUSH";
  if (freqs[0] === 4)                        return "FOUR_OF_A_KIND";
  if (freqs[0] === 3 && freqs[1] === 2)      return "FULL_HOUSE";
  if (isFlush)                               return "FLUSH";
  if (isStraight)                            return "STRAIGHT";
  if (freqs[0] === 3)                        return "THREE_OF_A_KIND";
  if (freqs[0] === 2 && freqs[1] === 2)      return "TWO_PAIR";
  if (freqs[0] === 2)                        return "ONE_PAIR";
  return "HIGH_CARD";
}

function displayHandBanner(handKey) {
  const hand = HAND_RANKS[handKey];
  handResult.className = `hand-banner ${hand.tier}`;
  handResult.innerHTML = `
    <div class="hand-main">
      <div class="hand-name">${hand.name}</div>
      <div class="hand-desc">${hand.desc}</div>
    </div>
    <span class="hand-badge">Rank ${hand.rank} / 10</span>
  `;
  handResult.style.display = "flex";
}

function highlightRanking(handKey) {
  document.querySelectorAll(".rank-item").forEach(el => el.classList.remove("rank-active"));
  const target = document.querySelector(`[data-key="${handKey}"]`);
  if (target) {
    target.classList.add("rank-active");
    target.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function applyHistoryFilters() {
  const searchTerm = document.getElementById("search-input").value.trim().toUpperCase();
  const suitFilter = document.getElementById("suit-filter").value;
  const sortOrder  = document.getElementById("sort-order").value;

  let result = handHistory.filter(entry =>
    entry.cards.some(card => card.value.toUpperCase().includes(searchTerm))
  );

  if (suitFilter !== "ALL") {
    result = result.filter(entry =>
      entry.cards.some(card => card.suit === suitFilter)
    );
  }

  result = result.sort((a, b) => {
    if (sortOrder === "NEWEST") return a.id > b.id ? -1 : 1;
    if (sortOrder === "OLDEST") return a.id < b.id ? -1 : 1;
    if (sortOrder === "BEST")   return HAND_RANKS[a.handKey].rank - HAND_RANKS[b.handKey].rank;
    if (sortOrder === "WORST")  return HAND_RANKS[b.handKey].rank - HAND_RANKS[a.handKey].rank;
    return 0;
  });

  renderHistory(result);
}

function renderHistory(entries) {
  if (entries.length === 0) {
    historyList.innerHTML = `<p class="empty-msg">${
      handHistory.length === 0
        ? "No hands dealt yet.<br/>Hit Deal to start!"
        : "No hands match your filters."
    }</p>`;
    return;
  }

  historyList.innerHTML = entries.map(entry => {
    const hand  = HAND_RANKS[entry.handKey];
    const time  = entry.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const cardImgs = entry.cards.map(c =>
      `<img src="${c.image}" alt="${c.value}" class="mini-card"/>`
    ).join("");

    return `
      <div class="history-entry ${hand.tier}">
        <div class="history-entry-top">
          <span class="history-hand-name">${hand.name}</span>
          <span class="history-time">Hand #${entry.id} · ${time}</span>
        </div>
        <div class="history-cards">${cardImgs}</div>
      </div>
    `;
  }).join("");
}

function toggleTheme() {
  document.body.classList.toggle("light-mode");
  const btn = document.getElementById("theme-toggle");
  btn.textContent = document.body.classList.contains("light-mode")
    ? "🌙 Dark Mode"
    : "☀ Light Mode";
}

createDeck();
