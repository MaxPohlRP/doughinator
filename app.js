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
  const totalRatio = Object.values(recipe.ratios).reduce((sum, val) => sum + val, 0);
  const scaleFactor = totalWeight / totalRatio;

  const ingredients = [];
  for (const [key, val] of Object.entries(recipe.ratios)) {
    let unit = 'g';
    if (key === 'water' || key === 'oil') unit = 'ml';

    const rawAmount = val * scaleFactor;
    let amount;
    if (key === 'yeast' || key === 'salt') {
      amount = rawAmount.toFixed(2);
    } else {
      amount = Math.round(rawAmount);
    }
    ingredients.push({ name: getZutatName(key), amount, unit });
  }

  // Zutatenliste
  const list = document.getElementById('ingredientsList');
  list.innerHTML = '';
  ingredients.forEach(ing => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${ing.amount} ${ing.unit}</strong> ${ing.name}`;
    list.appendChild(li);
  });

  // Beschreibung
  document.getElementById('description').textContent = recipe.shortDescription || '';
  document.getElementById('longDescription').textContent = recipe.longDescription || '';

  // Fermentation
  const fermentationList = document.getElementById('fermentationList');
  fermentationList.innerHTML = '';
  if (Array.isArray(recipe.fermentation)) {
    recipe.fermentation.forEach(step => {
      const li = document.createElement('li');
      li.textContent = `${step.name}: ${step.time}, ${step.temperature}`;
      fermentationList.appendChild(li);
    });
  }

  // Anleitung
  const instructionsList = document.getElementById('instructionsList');
  instructionsList.innerHTML = '';
  if (Array.isArray(recipe.instructions)) {
    recipe.instructions.forEach((step) => {
      const li = document.createElement('li');
      li.className = 'instruction-item';
      li.innerHTML = `
        <div class="instruction-content">
          <div class="instruction-title">${step.title}</div>
          <div class="instruction-detail">${step.detail}</div>
        </div>
      `;
      instructionsList.appendChild(li);
    });
  }

  // Weitere Anzeigen
  document.getElementById('totalWeight').textContent = `${ballCount} × ${ballWeight}g`;
  document.getElementById('totalWeightDisplay').textContent = `${totalWeight}g`;
  document.getElementById('hydrationDisplay').textContent = `${recipe.hydration}%`;

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

// Events
document.getElementById('teigVariante').addEventListener('change', () => {
  setDefaultsForSelectedRecipe();
  calculate();
});
document.getElementById('ballCount').addEventListener('input', calculate);
document.getElementById('ballWeight').addEventListener('input', calculate);

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
