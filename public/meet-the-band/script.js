const MEMBER_DATA_URL = "/global/assets/data/members.json";

document.addEventListener("DOMContentLoaded", async () => {
  const membersDiv = document.getElementById("band-members");
  if (!membersDiv) return;
  membersDiv.innerHTML = "";

  fetch(MEMBER_DATA_URL)
    .then((data) => {
      return data.json();
    })
    .then((members) => {
      constructMembers(Object.values(members));
    })
    .catch((err) => {
      alert(err);
    });

  function constructMembers(members) {
    if (members) {
      for (let member of members) {
        console.log(member.lastUpdated);
        const memberContainer = document.createElement("div");
        memberContainer.className = "member-cont";
        memberContainer.ariaLabel = `Description of band member ${member.name}`;

        const info = document.createElement("span");
        info.innerHTML = `<strong>${member.name}</strong> · <u>${member.pos}</u> · last edited <i>${formatApproximateTime(member.lastUpdated)}</i>`;
        const pfp = document.createElement("img");
        pfp.src = member.pfp;
        pfp.alt = member.name;
        const content = document.createElement("p");
        content.textContent = member.content;

        const infoDiv = document.createElement("div");
        infoDiv.className = "info-cont";

        const img = document.createElement("img");
        img.src = member.picture;
        img.alt = `${member.name} - full preview`;

        const summary = document.createElement("summary");
        summary.textContent = `Click to view ${member.name}`;
        const details = document.createElement("details");
        details.append(summary, img);

        infoDiv.append(pfp, info);
        memberContainer.append(infoDiv, details, content);

        membersDiv.appendChild(memberContainer);
      }
    }
  }
});
