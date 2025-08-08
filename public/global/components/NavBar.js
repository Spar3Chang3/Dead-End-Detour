const BUTTON_SVG = `
  <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-menu-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 6l16 0" /><path d="M4 12l16 0" /><path d="M4 18l16 0" /></svg>
  `;

const Links = {
  home: {
    link: "home",
    name: "Home",
  },
  meetTheBand: {
    link: "meet-the-band",
    name: "Meet The Band",
  },
  music: {
    link: "taste-of-music",
    name: "Try our Music",
  },
  contact: {
    link: "contact",
    name: "Contact Us",
  },
};

const linkArr = [Links.home, Links.meetTheBand, Links.music, Links.contact];

let navbarIsOpen = false;

function constructNavbar() {
  // Deletes html from <nav> before construction so beware
  const navEl = document.getElementById("navbar");
  navEl.innerHTML = "";
  const logoContainer = document.createElement("a");
  logoContainer.className = "nav-logo";
  const linkContainer = document.createElement("ul");
  linkContainer.className = "nav-list-cont";
  const spacer = document.createElement("div");
  spacer.ariaHidden = "true";
  spacer.className = "nav-spacer";

  for (const link of linkArr) {
    const li = document.createElement("li");
    li.className = "nav-list-el";

    const a = document.createElement("a");
    a.href = link.link;
    a.textContent = link.name;
    a.className = "nav-list-a";

    li.appendChild(a);
    linkContainer.appendChild(li);
  }

  logoContainer.textContent = "Dead End Detour"; // Need to change to an <img> tag but for now, there is no logo

  if (isMobile.get()) {
    const navBtn = document.createElement("button");
    navBtn.className = "nav-list-toggle";
    navBtn.innerHTML = BUTTON_SVG;
    navBtn.addEventListener("click", () => {
      if (navbarIsOpen) {
        linkContainer.classList.remove("active");
      } else {
        linkContainer.classList.add("active");
      }
      navbarIsOpen = !navbarIsOpen;
    });
    navEl.append(logoContainer, spacer, navBtn, linkContainer);
  } else {
    navEl.append(logoContainer, spacer, linkContainer);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Initial render
  constructNavbar();

  isMobile.onChange(constructNavbar);
});
