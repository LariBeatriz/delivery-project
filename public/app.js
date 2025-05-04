// Variáveis globais
const API_URL = 'http://localhost:3001/clients';
const API_URL_PRODUCTS = 'http://localhost:3001/produtos';
let map;
let currentClient = null;
let currentOrder = [];


// Máscaras de input
$(document).ready(() => {
  $('#cepClient').inputmask('99999-999');
  $('#phone').inputmask('(99) 99999-9999');
  $('#cep').inputmask('99999-999');
});

// // Inicializar mapa
// function initMap() {
//   if (!map) {
//     map = L.map('map').setView([-8.1173746, -34.8963753], 13); // Recife
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    
//     // Marcar pizzaria
//     L.marker([-8.1173746, -34.8963753])
//       .addTo(map)
//       .bindPopup('Pizzaria Dona Maria<br>Padre Carapuceiro, 590')
//       .openPopup();
//   }
// }

// Buscar CEP
async function fetchCep(cep) {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const data = await response.json();
  if (data.erro) throw new Error('CEP não encontrado.');
  return data;
}

// Carregar clientes
async function loadClients() {
  const response = await fetch(API_URL);
  const clients = await response.json();
  const select = document.getElementById('clientSelect');
  select.innerHTML = '';
  clients.forEach(client => {
    const option = document.createElement('option');
    option.value = JSON.stringify(client); // Salva o cliente como JSON
    option.textContent = `${client.name} - ${client.address}, ${client.neighborhood}`;
    select.appendChild(option);
  });
}

// Eventos
document.getElementById('btnNewClient').addEventListener('click', () => {
  document.getElementById('clientForm').classList.remove('d-none');
  document.getElementById('clientListSection').classList.add('d-none');
  document.getElementById('cepForm').classList.add('d-none');
  document.getElementById('clientId').value = ''; // Limpa o ID para indicar novo cliente
  document.getElementById('btnSave').textContent = 'Salvar'; // Botão para criar
});

document.getElementById('btnClientList').addEventListener('click', () => {
  loadClients();
  document.getElementById('clientListSection').classList.remove('d-none');
  document.getElementById('clientForm').classList.add('d-none');
  document.getElementById('cepForm').classList.add('d-none');
});

$(document).ready(function() {
  // Mostrar/ocultar o cardápio ao clicar no botão
  $('#btnProducts').on('click', function() {
      $('#menuSection').toggleClass('d-none');
  });
});

// document.getElementById('clientSelect').addEventListener('change', async () => {
//   const selectedClient = JSON.parse(document.getElementById('clientSelect').value);
//   document.getElementById('btnWhatsApp').classList.remove('d-none');
//   document.getElementById('btnEditClient').classList.remove('d-none');
//   document.getElementById('btnDeleteClient').classList.remove('d-none');

//   // Mostrar mapa
//   const address = `${selectedClient.address}, ${selectedClient.neighborhood}, ${selectedClient.city}`;
//   const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
//   const data = await response.json();
//   if (data.length > 0) {
//     document.getElementById('map').classList.remove('d-none');
//     initMap();
//     map.setView([data[0].lat, data[0].lon], 15);
//     L.marker([data[0].lat, data[0].lon])
//       .addTo(map)
//       .bindPopup('Cliente')
//       .openPopup();
//   }
// });

document.getElementById('btnWhatsApp').addEventListener('click', () => {
  const selectedClient = JSON.parse(document.getElementById('clientSelect').value);
  window.open(`https://wa.me/${selectedClient.phone.replace(/\D/g, '')}`, '_blank');
});

document.getElementById('btnEditClient').addEventListener('click', () => {
  const selectedClient = JSON.parse(document.getElementById('clientSelect').value);
  document.getElementById('clientId').value = selectedClient.id; // Define o ID para edição
  document.getElementById('name').value = selectedClient.name;
  document.getElementById('phone').value = selectedClient.phone;
  document.getElementById('cepClient').value = selectedClient.cep;
  document.getElementById('address').value = selectedClient.address;
  document.getElementById('neighborhood').value = selectedClient.neighborhood;
  document.getElementById('city').value = selectedClient.city;
  document.getElementById('state').value = selectedClient.state;
  document.getElementById('clientForm').classList.remove('d-none');
  document.getElementById('btnSave').textContent = 'Salvar Edição'; // Botão para editar
});

document.getElementById('btnDeleteClient').addEventListener('click', async () => {
  const selectedClient = JSON.parse(document.getElementById('clientSelect').value);
  await fetch(`${API_URL}/${selectedClient.id}`, { method: 'DELETE' });
  alert('Cliente excluído!');
  loadClients();
});

document.getElementById('clientForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const client = {
    id: document.getElementById('clientId').value || Date.now().toString(), // Garante que o ID seja uma string
    name: document.getElementById('name').value,
    phone: document.getElementById('phone').value,
    cep: document.getElementById('cepClient').value,
    address: document.getElementById('address').value,
    neighborhood: document.getElementById('neighborhood').value,
    city: document.getElementById('city').value,
    state: document.getElementById('state').value,
  };

  try {
    if (client.id && client.id !== Date.now().toString()) {
      // Edição: usar PUT
      await fetch(`${API_URL}/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
      });
      alert('Cliente atualizado com sucesso!');
    } else {
      // Criação: usar POST
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
      });
      alert('Cliente criado com sucesso!');
    }

    // Limpar formulário e recarregar lista
    document.getElementById('clientForm').reset();
    document.getElementById('clientForm').classList.add('d-none');
    loadClients();
  } catch (error) {
    alert('Erro ao salvar cliente: ' + error.message);
  }
});

document.getElementById('cepClient').addEventListener('blur', async () => {
  const cep = document.getElementById('cepClient').value.replace(/\D/g, '');
  if (cep.length !== 8) return;
  try {
    const data = await fetchCep(cep);
    document.getElementById('address').value = data.logradouro;
    document.getElementById('neighborhood').value = data.bairro;
    document.getElementById('city').value = data.localidade;
    document.getElementById('state').value = data.uf;
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById('cepForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const cep = document.getElementById('cep').value.replace(/\D/g, '');
  try {
    const data = await fetchCep(cep);
    alert(`Endereço: ${data.logradouro}, ${data.bairro}, ${data.localidade}`);
  } catch (error) {
    alert(error.message);
  }
});

// Cancelar edição
document.getElementById('btnCancel').addEventListener('click', () => {
  document.getElementById('clientForm').classList.add('d-none');
  document.getElementById('clientForm').reset();
});

// Função para atualizar o resumo do pedido
function updateOrderSummary() {
    if (currentOrder.length === 0) {
        $('#orderSummary').html('<p>Nenhum item no pedido.</p>');
        return;
    }

    let html = '<ul class="list-group mb-3">';
    let total = 0;

    currentOrder.forEach(item => {
        html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    ${item.name} - R$ ${item.price.toFixed(2)}
                    <button class="btn btn-sm btn-danger remove-item" data-index="${currentOrder.indexOf(item)}">Remover</button>
                </li>`;
        total += item.price;
    });

    html += '</ul>';
    html += `<p><strong>Total: R$ ${total.toFixed(2)}</strong></p>`;
    html += `<button class="btn btn-success w-100" id="finalizeOrder">Finalizar Pedido</button>`;

    $('#orderSummary').html(html);
}

$(document).ready(function() {
  // Quando clicar em "Adicionar ao Pedido"
  $(document).on('click', '.add-to-order', function() {
      const name = $(this).data('name');
      const price = parseFloat($(this).data('price'));

      currentOrder.push({ name, price });
      updateOrderSummary();
      alert(`✅ ${name} foi adicionado ao pedido!`);
  });

  // Remover item do pedido
  $(document).on('click', '.remove-item', function() {
      const index = $(this).data('index');
      currentOrder.splice(index, 1);
      updateOrderSummary();
  });

  // Finalizar Pedido
  $(document).on('click', '#finalizeOrder', function() {
      if (currentOrder.length === 0) {
          alert('O pedido está vazio!');
          return;
      }

      let message = 'Olá! Gostaria de fazer o seguinte pedido:%0A';
      currentOrder.forEach(item => {
          message += `🍕 ${item.name} - R$ ${item.price.toFixed(2)}%0A`;
      });
      const total = currentOrder.reduce((sum, item) => sum + item.price, 0);
      message += `%0ATotal: R$ ${total.toFixed(2)}`;
  });

  // Exibir o resumo do pedido na página
  $('body').append(`
      <div class="container mt-4">
          <h3>🛒 Meu Pedido</h3>
          <div id="orderSummary"><p>Nenhum item no pedido.</p></div>
      </div>
  `);
});

// Finalizar Pedido e enviar para a API de produtos
$(document).on('click', '#finalizeOrder', async function() {
  if (currentOrder === 0) {
      alert('O pedido está vazio!');
      return;
  }

  const total = currentOrder.reduce((sum, item) => sum + item.price, 0);

  // Cria o objeto do pedido (adaptar conforme sua estrutura desejada)
  const newOrder = {
      id: Date.now(),
      items: currentOrder,
      total: total
  };

  try {
      const response = await fetch(API_URL_PRODUCTS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrder)
      });

      if (response.ok) {
          alert('✅ Pedido finalizado e salvo com sucesso!');
          currentOrder = [];  // Limpa o pedido atual
          updateOrderSummary();  // Atualiza a tela
      } else {
          alert('Erro ao salvar o pedido.');
      }
  } catch (error) {
      console.error(error);
      alert('Erro ao conectar com a API.');
  }
});


// Criação: usar POST
document.getElementById('btnNewProduct').addEventListener('click', () => {
  document.getElementById('productForm').classList.remove('d-none');
  document.getElementById('productListSection').classList.add('d-none');
  document.getElementById('productId').value = '';
  document.getElementById('btnSaveProduct').textContent = 'Salvar';
});

