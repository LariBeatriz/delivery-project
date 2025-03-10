// Variáveis globais
const cepForm = document.getElementById('cepForm');
const clientForm = document.getElementById('clientForm');
const clientListSection = document.getElementById('clientListSection');
const clientSelect = document.getElementById('clientSelect');
const btnWhatsApp = document.getElementById('btnWhatsApp');

// Função para buscar CEP
async function fetchCep(cep) {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const data = await response.json();
  if (data.erro) throw new Error('CEP não encontrado.');
  return data;
}

// Função para carregar clientes do JSON Server
async function loadClients() {
  const response = await fetch('http://localhost:3000/clients');
  const clients = await response.json();
  clientSelect.innerHTML = '';
  clients.forEach(client => {
    const option = document.createElement('option');
    option.value = client.phone;
    option.textContent = `${client.name} - ${client.address}, ${client.neighborhood}`;
    clientSelect.appendChild(option);
  });
}

// Eventos
document.getElementById('btnNewClient').addEventListener('click', () => {
  cepForm.classList.add('d-none');
  clientListSection.classList.add('d-none');
  clientForm.classList.remove('d-none');
});

document.getElementById('btnClientList').addEventListener('click', () => {
  cepForm.classList.add('d-none');
  clientForm.classList.add('d-none');
  clientListSection.classList.remove('d-none');
  loadClients();
});

clientSelect.addEventListener('change', () => {
  btnWhatsApp.classList.remove('d-none');
});

btnWhatsApp.addEventListener('click', () => {
  const phone = clientSelect.value;
  window.open(`https://wa.me/${phone}`, '_blank');
});

cepForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cep = document.getElementById('cep').value.replace(/\D/g, '');
  try {
    const data = await fetchCep(cep);
    alert(`Endereço encontrado: ${data.logradouro}, ${data.bairro}, ${data.localidade}`);
  } catch (error) {
    alert(error.message);
  }
});

clientForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const client = {
    name: document.getElementById('name').value,
    phone: document.getElementById('phone').value,
    cep: document.getElementById('cepClient').value,
    address: document.getElementById('address').value,
    neighborhood: document.getElementById('neighborhood').value,
    city: document.getElementById('city').value,
    state: document.getElementById('state').value,
  };
  await fetch('http://localhost:3000/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  });
  alert('Cliente cadastrado com sucesso!');
  clientForm.reset();
});

// Preencher endereço automaticamente ao digitar o CEP no formulário de cadastro
document.getElementById('cepClient').addEventListener('blur', async () => {
  const cep = document.getElementById('cepClient').value.replace(/\D/g, '');
  if (cep.length !== 8) {
    alert('CEP inválido. Por favor, digite um CEP com 8 dígitos.');
    return;
  }
  try {
    const data = await fetchCep(cep);
    document.getElementById('address').value = data.logradouro || '';
    document.getElementById('neighborhood').value = data.bairro || '';
    document.getElementById('city').value = data.localidade || '';
    document.getElementById('state').value = data.uf || '';
  } catch (error) {
    alert(error.message);
  }
});