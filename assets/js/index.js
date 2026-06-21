function executeFeatureFuzzySearchLookup(searchStringValue) {
  const cleanQuery = searchStringValue.toLowerCase().trim();
  const cards = document.querySelectorAll(".feature-card");
  const categories = document.querySelectorAll(".category-block-node");
  const counterBadge = document.getElementById("search-counter-badge");
  const fallbackPrompt = document.getElementById("search-fallback-prompt");

  let accumulatedMatchesCount = 0;

  if (cleanQuery === "") {
    // Clear state structures: Reset display grids variables back to default standard rendering
    cards.forEach((card) => card.classList.remove("card-hidden"));
    categories.forEach((cat) => cat.classList.remove("category-hidden"));
    counterBadge.classList.add("hidden");
    fallbackPrompt.classList.replace("flex", "hidden");
    return;
  }

  // Execute text evaluations loops across all feature cards tracks text metrics structures
  cards.forEach((card) => {
    const headerText = card.querySelector("h4").innerText.toLowerCase();
    const descriptionText = card.querySelector("p").innerText.toLowerCase();
    const invisibleMetaTextNode = card.querySelector(".hidden")
      ? card.querySelector(".hidden").innerText.toLowerCase()
      : "";

    if (
      headerText.includes(cleanQuery) ||
      descriptionText.includes(cleanQuery) ||
      invisibleMetaTextNode.includes(cleanQuery)
    ) {
      card.classList.remove("card-hidden");
      accumulatedMatchesCount++;
    } else {
      card.classList.add("card-hidden");
    }
  });

  // Dynamically hide category blocks nodes columns if they house zero relevant matches
  categories.forEach((category) => {
    const visibleChildCardsCount = category.querySelectorAll(
      ".feature-card:not(.card-hidden)",
    ).length;
    if (visibleChildCardsCount === 0) {
      category.classList.add("category-hidden");
    } else {
      category.classList.remove("category-hidden");
    }
  });

  // Update search dashboard indicators layout status nodes text fields parameters
  counterBadge.classList.remove("hidden");
  counterBadge.innerText = `${accumulatedMatchesCount} Match${accumulatedMatchesCount === 1 ? "" : "es"}`;

  if (accumulatedMatchesCount === 0) {
    fallbackPrompt.classList.replace("hidden", "flex");
  } else {
    fallbackPrompt.classList.replace("flex", "hidden");
  }
}


window.addEventListener('load', () => {
            setTimeout(() => {
                const preloaderNode = document.getElementById('fusionmint-global-loader');
                if(preloaderNode) {
                    // Start opacity transition fade out
                    preloaderNode.classList.add('loading-pane-transition');
                    
                    // DIRECT OVERRIDE: Unlock core layout overflow variables to allow vertical page scrolling
                    document.body.style.overflow = "visible";
                    document.documentElement.style.overflow = "visible";
                    
                    // Wipe the preloader node component from DOM tree branch layers entirely after 500ms
                    setTimeout(() => preloaderNode.remove(), 500);
                }
            }, 1000); // Strict 3000ms duration clock lock
        });