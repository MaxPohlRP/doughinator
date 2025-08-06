let pizzaRecipes = {};

async function loadRecipes() {
  try {
    const response = await fetch('reciepes.json');
    const data = await response.json();
    pizzaRecipes = data.pizzaTeige;
  } catch (error) {
    console.error('Fehler beim Laden der Rezepte:', error);
    showError('Fehler beim Laden der Rezepte. Bitte prüfen Sie die Datei oder versuchen Sie es später erneut.');
  }
}

function showError(msg) {
  document.getElementById('results').style.display = 'none';
  let errorDiv = document.getElementById('errorMsg');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.id = 'errorMsg';
    errorDiv.style.color = 'red';
    errorDiv.style.margin = '1em 0';
    document.body.insertBefore(errorDiv, document.body.firstChild.nextSibling);
  }
  errorDiv.textContent = msg;
}

function calculate() {
  const teigVariante = document.getElementById('teigVariante').value;
  const ballCount = parseInt(document.getElementById('ballCount').value);
  const ballWeight = parseFloat(document.getElementById('ballWeight').value);

  const zutatenNamen = {
    flour: "Mehl (Tipo 00)",
    water: "Wasser (Eiskaltes)",
    salt: "Salz (wenn möglich Meersalz)",
    yeast: "Hefe frisch",
    oil: "Olivenöl",
    biga: "Biga"
  };

  const ingredientsList = document.getElementById('ingredientsList');
  ingredientsList.innerHTML = '';

  if (!ballCount || !ballWeight || ballCount < 1 || ballWeight < 50) {
    document.getElementById('results').style.display = 'none';
    return;
  }

  const recipe = pizzaRecipes[teigVariante];
  if (!recipe) {
    showError('Rezept nicht gefunden!');
    return;
  }

  // Fehleranzeige entfernen, falls alles ok
  const errorDiv = document.getElementById('errorMsg');
  if (errorDiv) errorDiv.textContent = '';

  const totalWeight = ballCount * ballWeight;
  let totalRatio = 0;
  let scaleFactor = 1;

  if (recipe.ratios) {
    totalRatio = Object.values(recipe.ratios).reduce((sum, val) => sum + val, 0);
    scaleFactor = totalWeight / totalRatio;

    Object.entries(recipe.ratios).forEach(([key, value]) => {
      let li = document.createElement('li');
      li.textContent = `${Math.round(value * scaleFactor)}g : ${zutatenNamen[key] || key}`;
      ingredientsList.appendChild(li);
    });
  } else if (recipe.vorteig && recipe.hauptteig) {
    // Zutaten aus Vorteig und Hauptteig zusammenzählen
    const vorteigSum = Object.values(recipe.vorteig.ratios).reduce((sum, val) => sum + val, 0);
    const hauptteigSum = Object.values(recipe.hauptteig.ratios).reduce((sum, val) => sum + val, 0);
    totalRatio = vorteigSum + hauptteigSum;
    scaleFactor = totalWeight / totalRatio;

    // Vorteig Überschrift
    let vorteigHeader = document.createElement('h3');
    vorteigHeader.textContent = 'Vorteig';
    ingredientsList.appendChild(vorteigHeader);

    // Vorteig Zutaten skaliert
    Object.entries(recipe.vorteig.ratios).forEach(([key, value]) => {
      let li = document.createElement('li');
      if (key === 'yeast' || key === 'salt') {
        li.textContent = `${(value * scaleFactor).toFixed(2)}g : ${zutatenNamen[key] || key}`;
      } else {
        li.textContent = `${(value * scaleFactor).toFixed(0)}g : ${zutatenNamen[key] || key}`;
      }
      ingredientsList.appendChild(li);
    });

    // Hauptteig Überschrift
    let hauptteigHeader = document.createElement('h3');
    hauptteigHeader.textContent = 'Hauptteig';
    ingredientsList.appendChild(hauptteigHeader);

    // Vorteig-Masse berechnen und als erste Zutat im Hauptteig listen
    const vorteigMasse = Object.values(recipe.vorteig.ratios).reduce((sum, val) => sum + val, 0) * scaleFactor;
    let vorteigLi = document.createElement('li');
    vorteigLi.textContent = `${vorteigMasse.toFixed(0)}g : Vorteig`;
    ingredientsList.appendChild(vorteigLi);

    // Hauptteig Zutaten skaliert
    Object.entries(recipe.hauptteig.ratios).forEach(([key, value]) => {
      let li = document.createElement('li');

      if (key === 'yeast' || key === 'salt') {
        li.textContent = `${(value * scaleFactor).toFixed(2)}g : ${zutatenNamen[key] || key}`;
      } else {
        li.textContent = `${(value * scaleFactor).toFixed(0)}g : ${zutatenNamen[key] || key}`;
      }


      ingredientsList.appendChild(li);
    });
  } else {
    ingredientsList.innerHTML = '<li>Keine Zutaten gefunden!</li>';
  }

  // Beschreibung
  document.getElementById('description').textContent = recipe.shortDescription || '';
  document.getElementById('longDescription').textContent = recipe.longDescription || '';

  // Fermentation anzeigen
  const fermentationList = document.getElementById('fermentationList');
  fermentationList.innerHTML = '';
  if (recipe.fermentation) {
    // Standard-Rezept
    recipe.fermentation.forEach(step => {
      const li = document.createElement('li');
      li.textContent = `${step.name}: ${step.time}, ${step.temperature}`;
      fermentationList.appendChild(li);
    });
  } else if (recipe.vorteig && recipe.hauptteig) {
    // Vorteig-Gärzeiten
    let vorteigHeader = document.createElement('h3');
    vorteigHeader.textContent = 'Vorteig Gärzeiten';
    fermentationList.appendChild(vorteigHeader);
    recipe.vorteig.fermentation.forEach(step => {
      const li = document.createElement('li');
      li.textContent = `${step.name}: ${step.time}, ${step.temperature}`;
      fermentationList.appendChild(li);
    });
    // Hauptteig-Gärzeiten
    let hauptteigHeader = document.createElement('h3');
    hauptteigHeader.textContent = 'Hauptteig Gärzeiten';
    fermentationList.appendChild(hauptteigHeader);
    recipe.hauptteig.fermentation.forEach(step => {
      const li = document.createElement('li');
      li.textContent = `${step.name}: ${step.time}, ${step.temperature}`;
      fermentationList.appendChild(li);
    });
  }

  // Arbeitsschritte anzeigen
  const instructionsList = document.getElementById('instructionsList');
  instructionsList.innerHTML = '';
  if (recipe.instructions) {
    // Standard-Rezept
    recipe.instructions.forEach((step, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div style="display:flex;align-items:flex-start;">
          <div style="font-weight:bold;font-size:1.2em;margin-right:0.7em;"></div>
          <div>
            <div style="font-weight:bold;">${step.title}</div>
            <div>${step.detail}</div>
          </div>
        </div>
      `;
      instructionsList.appendChild(li);
    });
  } else if (recipe.vorteig && recipe.hauptteig) {
    // Vorteig-Arbeitsschritte
    let vorteigHeader = document.createElement('h3');
    vorteigHeader.textContent = 'Vorteig Arbeitsschritte';
    instructionsList.appendChild(vorteigHeader);
    recipe.vorteig.instructions.forEach((step, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div style="display:flex;align-items:flex-start;">
          <div style="font-weight:bold;font-size:1.2em;margin-right:0.7em;"></div>
          <div>
            <div style="font-weight:bold;">${step.title}</div>
            <div>${step.detail}</div>
          </div>
        </div>
      `;
      instructionsList.appendChild(li);
    });
    // Hauptteig-Arbeitsschritte
    let hauptteigHeader = document.createElement('h3');
    hauptteigHeader.textContent = 'Hauptteig Arbeitsschritte';
    instructionsList.appendChild(hauptteigHeader);
    recipe.hauptteig.instructions.forEach((step, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div style="display:flex;align-items:flex-start;">
          <div style="font-weight:bold;font-size:1.2em;margin-right:0.7em;"></div>
          <div>
            <div style="font-weight:bold;">${step.title}</div>
            <div>${step.detail}</div>
          </div>
        </div>
      `;
      instructionsList.appendChild(li);
    });
  }

  // Weitere Anzeigen
  document.getElementById('totalWeight').textContent = `${ballCount} × ${ballWeight}g`;
  document.getElementById('totalWeightDisplay').textContent = `${totalWeight.toFixed(2)}g`;
  document.getElementById('hydrationDisplay').textContent = `${recipe.hydration ? recipe.hydration : '-'}%`;

  document.getElementById('results').style.display = 'block';
}

function getZutatName(key) {
  switch (key) {
    case 'flour': return 'Mehl (Tipo 00)';
    case 'water': return 'Wasser';
    case 'salt': return 'Salz';
    case 'yeast': return 'Hefe (frisch)';
    case 'oil': return 'Olivenöl';
    default: return key;
  }
}

function setDefaultsForSelectedRecipe() {
  const teigVariante = document.getElementById('teigVariante').value;
  const recipe = pizzaRecipes[teigVariante];
  if (recipe && recipe.defaults) {
    document.getElementById('ballCount').value = recipe.defaults.balls;
    document.getElementById('ballWeight').value = recipe.defaults.ball_weight;
  }
}

function showRecipe(recipe) {
  // Zutaten
  let ingredientsList = document.getElementById('ingredientsList');
  ingredientsList.innerHTML = '';

  if (recipe.vorteig && recipe.hauptteig) {
    // Zutaten Vorteig
    let vorteigTitle = document.createElement('li');
    vorteigTitle.textContent = 'Vorteig:';
    ingredientsList.appendChild(vorteigTitle);
    Object.entries(recipe.vorteig.ratios).forEach(([key, value]) => {
      let li = document.createElement('li');
      li.textContent = `${key}: ${value}g`;
      ingredientsList.appendChild(li);
    });
    // Zutaten Hauptteig
    let hauptteigTitle = document.createElement('li');
    hauptteigTitle.textContent = 'Hauptteig:';
    ingredientsList.appendChild(hauptteigTitle);
    Object.entries(recipe.hauptteig.ratios).forEach(([key, value]) => {
      let li = document.createElement('li');
      li.textContent = `${key}: ${value}g`;
      ingredientsList.appendChild(li);
    });
  } else {
    // Zutaten wie bisher
    Object.entries(recipe.ratios).forEach(([key, value]) => {
      let li = document.createElement('li');
      li.textContent = `${key}: ${value}g`;
      ingredientsList.appendChild(li);
    });
  }

  // Fermentation und Arbeitsschritte analog prüfen und anzeigen
}

// Events
document.getElementById('teigVariante').addEventListener('change', () => {
  setDefaultsForSelectedRecipe();
  calculate();
});
document.getElementById('ballCount').addEventListener('input', calculate);
document.getElementById('ballWeight').addEventListener('input', calculate);

// Counter-Funktionen für Buttons
function incrementValue(elementId, step = 1) {
  const element = document.getElementById(elementId);
  const currentValue = parseInt(element.value) || 0;
  const newValue = currentValue + step;
  
  // Minimum-Werte beachten
  if (elementId === 'ballCount' && newValue >= 1) {
    element.value = newValue;
  } else if (elementId === 'ballWeight' && newValue >= 50) {
    element.value = newValue;
  }
  
  calculate();
}

function decrementValue(elementId, step = 1) {
  const element = document.getElementById(elementId);
  const currentValue = parseInt(element.value) || 0;
  const newValue = currentValue - step;
  
  // Minimum-Werte beachten
  if (elementId === 'ballCount' && newValue >= 1) {
    element.value = newValue;
  } else if (elementId === 'ballWeight' && newValue >= 50) {
    element.value = newValue;
  }
  
  calculate();
}

// Init
async function init() {
  await loadRecipes();
  populateRecipeDropdown();
  setDefaultsForSelectedRecipe();
  calculate();
}

function populateRecipeDropdown() {
  const select = document.getElementById('teigVariante');
  select.innerHTML = '';
  for (const key in pizzaRecipes) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = pizzaRecipes[key].name;
    select.appendChild(option);
  }
}

init();
