const Links = {
    home: {
        link: 'home',
        name: 'Home'
    },
    meetTheBand: {
        link: 'meet-the-band',
        name: 'Meet The Band'
    },
    music: {
        link: 'taste-of-music',
        name: 'Try our Music'
    },
    contact: {
        link: 'contact',
        name: 'Contact Us'
    },
}

const linkArr = [Links.home, Links.meetTheBand, Links.music, Links.contact];

document.addEventListener("DOMContentLoaded", () => {
    const navEl = document.getElementById("navbar");
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

    navEl.append(logoContainer, spacer, linkContainer);
});