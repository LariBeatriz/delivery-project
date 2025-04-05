// Variáveis globais
const API_URL = 'http://localhost:3001/clients';
let map;
let currentClient = null;

// Máscaras de input
$(document).ready(() => {
  $('#cepClient').inputmask('99999-999');
  $('#phone').inputmask('(99) 99999-9999');
  $('#cep').inputmask('99999-999');
});

// Inicializar mapa
function initMap() {
  if (!map) {
    map = L.map('map').setView([-8.1173746, -34.8963753], 13); // Recife
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    
    // Marcar pizzaria
    L.marker([-8.1173746, -34.8963753])
      .addTo(map)
      .bindPopup('Pizzaria Dona Maria<br>Padre Carapuceiro, 590')
      .openPopup();
  }
}

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

document.getElementById('clientSelect').addEventListener('change', async () => {
  const selectedClient = JSON.parse(document.getElementById('clientSelect').value);
  document.getElementById('btnWhatsApp').classList.remove('d-none');
  document.getElementById('btnEditClient').classList.remove('d-none');
  document.getElementById('btnDeleteClient').classList.remove('d-none');

  // Mostrar mapa
  const address = `${selectedClient.address}, ${selectedClient.neighborhood}, ${selectedClient.city}`;
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
  const data = await response.json();
  if (data.length > 0) {
    document.getElementById('map').classList.remove('d-none');
    initMap();
    map.setView([data[0].lat, data[0].lon], 15);
    L.marker([data[0].lat, data[0].lon])
      .addTo(map)
      .bindPopup('Cliente')
      .openPopup();
  }
});

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