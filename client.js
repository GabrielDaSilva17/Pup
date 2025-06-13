// client.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, get, child, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

// Sua configuração do Firebase (a mesma usada no admin.js)
const firebaseConfig = {
  apiKey: "AIzaSyAdAix9Kqgb9ldJm0iJaNpB00OreeZAtX8",
  authDomain: "gamesplatform-94503.firebaseapp.com",
  databaseURL: "https://gamesplatform-94503-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gamesplatform-94503",
  storageBucket: "gamesplatform-94503.firebasestorage.app",
  messagingSenderId: "191397057160",
  appId: "1:191397057160:web:4e4bb7127564b7457fc53d",
  measurementId: "G-2J7JTFPBFW"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Referências aos elementos da nova seção de busca
const globalRedeemCodeInput = document.getElementById('globalRedeemCodeInput');
const searchCouponBtn = document.getElementById('searchCouponBtn');
const searchMessage = document.getElementById('searchMessage');
const foundCouponContainer = document.getElementById('found-coupon-container');

// Referências aos elementos do Modal
const redeemModal = document.getElementById('redeemModal');
const closeButton = document.querySelector('.close-button');
const modalCouponTitle = document.getElementById('modalCouponTitle');
const modalCouponDescription = document.getElementById('modalCouponDescription');
const modalCouponItems = document.getElementById('modalCouponItems');
// const redeemCodeInput = document.getElementById('redeemCodeInput'); // REMOVIDO: Não é mais necessário para validação no modal
const modalMessage = document.getElementById('modalMessage');
const confirmRedeemBtn = document.getElementById('confirmRedeemBtn');
const cancelRedeemBtn = document.getElementById('cancelRedeemBtn');

// Variáveis para armazenar o ID e o código do cupom que está no modal
let currentModalCouponId = null;
let currentModalRedemptionCode = null; // Mantido para referência, mas não para validação

// --- Funções Auxiliares ---

// Função para exibir mensagens na área de busca
function showSearchMessage(message, isError = false) {
  searchMessage.textContent = message;
  searchMessage.classList.remove('hidden', 'success', 'error');
  if (isError) {
    searchMessage.classList.add('error');
  } else {
    searchMessage.classList.add('success');
  }
}

// Função para ocultar a mensagem da área de busca
function hideSearchMessage() {
  searchMessage.classList.add('hidden');
  searchMessage.textContent = '';
}

// Função para exibir mensagens no modal
function showModalMessage(message, isError = false) {
  modalMessage.textContent = message;
  modalMessage.classList.remove('hidden', 'success', 'error');
  if (isError) {
    modalMessage.classList.add('error');
  } else {
    modalMessage.classList.add('success');
  }
}

// Função para ocultar a mensagem do modal
function hideModalMessage() {
  modalMessage.classList.add('hidden');
  modalMessage.textContent = '';
}

// --- Funções do Modal ---

// Abre o modal com os dados do cupom
function openRedeemModal(coupon, couponId) {
  currentModalCouponId = couponId;
  currentModalRedemptionCode = coupon.redemptionCode; // Ainda útil para referência
  
  modalCouponTitle.textContent = coupon.title;
  modalCouponDescription.textContent = coupon.description;
  
  modalCouponItems.innerHTML = '';
  if (coupon.items && Array.isArray(coupon.items)) {
    coupon.items.forEach(item => {
      const listItem = document.createElement('li');
      listItem.textContent = item;
      modalCouponItems.appendChild(listItem);
    });
  }
  
  hideModalMessage(); // Limpa mensagens anteriores
  
  // Desabilita botões se o cupom já foi resgatado
  if (coupon.redeemed) {
    confirmRedeemBtn.disabled = true;
    showModalMessage('Este cupom já foi resgatado!', true);
  } else {
    confirmRedeemBtn.disabled = false;
  }
  
  redeemModal.style.display = 'flex'; // Exibe o modal (usando flex para centralizar)
}

// Fecha o modal
function closeRedeemModal() {
  redeemModal.style.display = 'none';
  currentModalCouponId = null;
  currentModalRedemptionCode = null;
  hideModalMessage();
}

// --- Listeners de Eventos do Modal ---

closeButton.addEventListener('click', closeRedeemModal);
cancelRedeemBtn.addEventListener('click', closeRedeemModal);

// Fecha o modal ao clicar fora do conteúdo do modal
window.addEventListener('click', (event) => {
  if (event.target === redeemModal) {
    closeRedeemModal();
  }
});

// Listener para o botão "Confirmar Resgate" dentro do modal
confirmRedeemBtn.addEventListener('click', async () => {
  hideModalMessage();
  
  // Como o código já foi validado na busca, basta confirmar o resgate
  try {
    const couponRef = ref(database, `coupons/${currentModalCouponId}`);
    await update(couponRef, {
      redeemed: true,
      redeemedAt: new Date().toISOString()
    });
    showModalMessage('Cupom resgatado com sucesso!', false);
    
    // Desabilita botão após o resgate bem-sucedido
    confirmRedeemBtn.disabled = true;
    
    // Fecha o modal após um curto atraso e re-busca o cupom para atualizar o status
    setTimeout(() => {
      closeRedeemModal();
      // Re-busca o cupom para que ele apareça como "Resgatado" na tela principal
      searchCoupon(globalRedeemCodeInput.value.trim());
    }, 1500);
    
  } catch (error) {
    console.error("Erro ao resgatar cupom:", error);
    showModalMessage(`Erro ao resgatar cupom: ${error.message}`, true);
  }
});


// --- Lógica de Busca e Exibição de Cupom ---

// Função para renderizar um único cupom no HTML
function renderCouponCard(coupon, couponId) {
  const card = document.createElement('div');
  card.classList.add('coupon-card', coupon.color || 'normal');
  
  if (coupon.redeemed) {
    card.classList.add('redeemed');
  }
  
  card.innerHTML = `
        <h2>${coupon.title}</h2>
        <p>${coupon.description}</p>
        <h3>Itens do Cupom:</h3>
        <ul>
            ${coupon.items.map(item => `<li>${item}</li>`).join('')}
        </ul>
        <button class="open-modal-btn">${coupon.redeemed ? 'Cupom Resgatado' : 'Resgatar Cupom'}</button>
    `;
  
  const openModalBtn = card.querySelector('.open-modal-btn');
  if (coupon.redeemed) {
    openModalBtn.disabled = true;
  } else {
    openModalBtn.addEventListener('click', () => {
      openRedeemModal(coupon, couponId); // Abre o modal
    });
  }
  
  return card;
}

// Função principal para buscar o cupom
async function searchCoupon(code) {
  foundCouponContainer.innerHTML = ''; // Limpa o container
  hideSearchMessage();
  
  if (!code) {
    foundCouponContainer.innerHTML = '<p class="initial-message">Digite um código acima para buscar seu cupom.</p>';
    return;
  }
  
  showSearchMessage('Buscando cupom...', false);
  
  try {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, 'coupons')); // Busca todos os cupons
    
    if (snapshot.exists()) {
      const coupons = snapshot.val();
      let found = false;
      
      // Itera sobre todos os cupons para encontrar o que corresponde ao código
      for (const couponId in coupons) {
        const coupon = coupons[couponId];
        if (coupon.redemptionCode && coupon.redemptionCode.toUpperCase() === code.toUpperCase()) { // Comparação case-insensitive
          found = true;
          if (coupon.redeemed) {
            showSearchMessage('Este cupom já foi resgatado.', true);
            foundCouponContainer.innerHTML = '<p class="initial-message">Cupom já resgatado. Verifique o código ou tente outro.</p>';
          } else {
            foundCouponContainer.appendChild(renderCouponCard(coupon, couponId));
            hideSearchMessage(); // Oculta a mensagem de busca
          }
          break; // Cupom encontrado, pode sair do loop
        }
      }
      
      if (!found) {
        showSearchMessage('Cupom não encontrado.', true);
        foundCouponContainer.innerHTML = '<p class="initial-message">Código de cupom inválido. Tente novamente.</p>';
      }
      
    } else {
      showSearchMessage('Nenhum cupom disponível no sistema.', true);
      foundCouponContainer.innerHTML = '<p class="initial-message">Nenhum cupom disponível no sistema.</p>';
    }
  } catch (error) {
    console.error("Erro ao buscar cupom:", error);
    showSearchMessage(`Erro ao buscar cupom: ${error.message}`, true);
    foundCouponContainer.innerHTML = '<p class="initial-message">Erro ao buscar cupom. Tente novamente mais tarde.</p>';
  }
}

// --- Listeners da Seção de Busca ---

searchCouponBtn.addEventListener('click', () => {
  const code = globalRedeemCodeInput.value.trim();
  searchCoupon(code);
});

// Permite buscar também ao pressionar Enter no campo de busca
globalRedeemCodeInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    const code = globalRedeemCodeInput.value.trim();
    searchCoupon(code);
  }
});

// Mensagem inicial ao carregar a página
foundCouponContainer.innerHTML = '<p class="initial-message">Digite um código acima para buscar seu cupom.</p>';