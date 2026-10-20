const screens = [
  { id: "364:23434", name: "地图探索 / 默认状态", asset: "./public/assets/output-01.png" },
  { id: "364:23742", name: "地点详情 / 状态 01", asset: "./public/assets/output-02.png" },
  { id: "364:23871", name: "地点详情 / 状态 02", asset: "./public/assets/output-03.png" },
  { id: "364:23930", name: "地图探索 / 备选画板", asset: "./public/assets/output-04.png" },
  { id: "364:24086", name: "交互与组件说明", asset: "./public/assets/output-05.png" },
  { id: "364:24192", name: "地图探索 / 宽版画板", asset: "./public/assets/output-06.png" },
];

const image = document.querySelector("#screen-image");
const title = document.querySelector("#screen-title");
const counter = document.querySelector("#counter");
const list = document.querySelector("#screen-list");
const previous = document.querySelector("#previous");
const next = document.querySelector("#next");
const artboard = document.querySelector("#artboard");
let current = 0;

function render(index) {
  current = (index + screens.length) % screens.length;
  const screen = screens[current];
  image.src = screen.asset;
  image.alt = `${screen.name}，Figma 节点 ${screen.id}`;
  title.textContent = screen.name;
  counter.textContent = `${current + 1} / ${screens.length}`;
  [...list.children].forEach((button, buttonIndex) => {
    button.setAttribute("aria-current", buttonIndex === current ? "page" : "false");
  });
}

screens.forEach((screen, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = `${String(index + 1).padStart(2, "0")} · ${screen.name}`;
  button.addEventListener("click", () => render(index));
  list.append(button);
});

previous.addEventListener("click", () => render(current - 1));
next.addEventListener("click", () => render(current + 1));
document.querySelector("#fullscreen").addEventListener("click", () => artboard.requestFullscreen());
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") render(current - 1);
  if (event.key === "ArrowRight") render(current + 1);
});

render(0);
