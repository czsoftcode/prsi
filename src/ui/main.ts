const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  const title = document.createElement("h1");
  title.textContent = "Prší";

  const card = document.createElement("img");
  card.src = "/cards/rub.png";
  card.alt = "Rub karty";
  card.width = 158;

  app.append(title, card);
}
