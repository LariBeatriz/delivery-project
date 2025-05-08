/**
 * @swagger
 * tags:
 *   - name: Clientes
 *     description: Operações relacionadas a clientes
 *   - name: Produtos
 *     description: Operações relacionadas a produtos
 *   - name: Pedidos
 *     description: Operações relacionadas a pedidos
 *   - name: CEP
 *     description: Consulta de endereço por CEP
 */

// Variáveis globais
const API_URL = 'http://localhost:3001/clients';
const ORDERS_API_URL = 'http://localhost:3001/orders';
const PRODUCTS_API_URL = 'http://localhost:3001/products';
let map;
let currentClient = null;
let products = [];
let currentOrder = [];

// Máscaras de input
$(document).ready(() => {
  $('#cepClient').inputmask('99999-999');
  $('#phone').inputmask('(99) 99999-9999');
  $('#cep').inputmask('99999-999');
});

/**
 * @swagger
 * /map:
 *   get:
 *     summary: Inicializa o mapa
 *     tags: [Clientes]
 *     responses:
 *       200:
 *         description: Mapa inicializado com sucesso
 */
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

/**
 * @swagger
 * /cep/{cep}:
 *   get:
 *     summary: Busca endereço por CEP
 *     tags: [CEP]
 *     parameters:
 *       - in: path
 *         name: cep
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{8}$'
 *         description: CEP a ser consultado (apenas números)
 *     responses:
 *       200:
 *         description: Endereço encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cep:
 *                   type: string
 *                 logradouro:
 *                   type: string
 *                 bairro:
 *                   type: string
 *                 localidade:
 *                   type: string
 *                 uf:
 *                   type: string
 *       400:
 *         description: CEP inválido ou não encontrado
 */
async function fetchCep(cep) {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const data = await response.json();
  if (data.erro) throw new Error('CEP não encontrado.');
  return data;
}

/**
 * @swagger
 * /clients:
 *   get:
 *     summary: Retorna todos os clientes
 *     tags: [Clientes]
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Client'
 *       500:
 *         description: Erro ao carregar clientes
 */
async function loadClients() {
  try {
    const response = await fetch(API_URL);
    const clients = await response.json();
    const select = document.getElementById('clientSelect');
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    
    clients.forEach(client => {
      const option = document.createElement('option');
      option.value = JSON.stringify(client);
      option.textContent = `${client.name} - ${client.phone || ''} ${client.address ? `, ${client.address}` : ''}`;
      select.appendChild(option);
    });
    
    // Resetar os botões e mapa
    document.getElementById('btnWhatsApp').classList.add('d-none');
    document.getElementById('btnEditClient').classList.add('d-none');
    document.getElementById('btnDeleteClient').classList.add('d-none');
    document.getElementById('map').classList.add('d-none');
    
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
    alert('Erro ao carregar clientes');
  }
}

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Retorna todos os produtos
 *     tags: [Produtos]
 *     responses:
 *       200:
 *         description: Lista de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Erro ao carregar produtos
 */
async function loadProducts() {
  try {
    const response = await fetch(PRODUCTS_API_URL);
    products = await response.json();
    
    document.getElementById('productCategory').addEventListener('change', function() {
      const category = this.value;
      const productSelect = document.getElementById('productSelect');
      
      productSelect.innerHTML = '<option value="">Selecione um produto</option>';
      productSelect.disabled = !category;
      
      if (category) {
        const filteredProducts = products.filter(p => p.category === category);
        filteredProducts.forEach(product => {
          const option = document.createElement('option');
          option.value = product.id;
          option.textContent = `${product.name} - R$ ${product.price.toFixed(2)}`;
          option.dataset.price = product.price;
          productSelect.appendChild(option);
        });
      }
    });
    
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    products = [
      { id: 1, name: "Pizza Calabresa", price: 45.90, category: "Pizza" },
      { id: 2, name: "Pizza Margherita", price: 42.50, category: "Pizza" },
      { id: 3, name: "Pizza Portuguesa", price: 48.75, category: "Pizza" },
      { id: 4, name: "Coca-Cola 2L", price: 12.00, category: "Bebida" },
      { id: 5, name: "Suco de Laranja", price: 8.50, category: "Bebida" },
      { id: 6, name: "Pudim", price: 10.00, category: "Sobremesa" },
      { id: 7, name: "Brownie", price: 12.50, category: "Sobremesa" }
    ];
  }
}

// Função para atualizar o resumo do pedido
function updateOrderSummary() {
  const orderSummary = document.getElementById('orderSummary');
  if (!orderSummary) return;

  if (currentOrder.length === 0) {
    orderSummary.innerHTML = '<p>Nenhum item no pedido.</p>';
    return;
  }

  let html = '<ul class="list-group mb-3">';
  let total = 0;

  currentOrder.forEach((item, index) => {
    html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                ${item.name} - R$ ${item.price.toFixed(2)}
                <button class="btn btn-sm btn-danger remove-item" data-index="${index}">Remover</button>
            </li>`;
    total += item.price;
  });

  html += '</ul>';
  html += `<p><strong>Total: R$ ${total.toFixed(2)}</strong></p>`;
  html += `<button class="btn btn-success w-100" id="finalizeOrder">Finalizar Pedido</button>`;

  orderSummary.innerHTML = html;
}

// Função auxiliar para adicionar itens ao pedido
function addOrderItem(productId, productName, productPrice, quantity) {
  const itemsContainer = document.getElementById('orderItems');
  const itemId = Date.now();
  const subtotal = productPrice * quantity;
  
  const itemElement = document.createElement('div');
  itemElement.className = 'card mb-2';
  itemElement.innerHTML = `
    <div class="card-body p-2">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h6 class="mb-1">${productName} x${quantity}</h6>
          <small class="text-muted">R$ ${productPrice.toFixed(2)} cada</small>
        </div>
        <div class="text-end">
          <h6 class="mb-0">R$ ${subtotal.toFixed(2)}</h6>
          <button type="button" class="btn btn-sm btn-outline-danger btnRemoveItem" data-id="${itemId}">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
      <input type="hidden" name="items" value='${JSON.stringify({
        productId: productId,
        name: productName,
        price: productPrice,
        quantity: quantity
      })}'>
    </div>
  `;
  
  itemsContainer.appendChild(itemElement);
  
  itemElement.querySelector('.btnRemoveItem').addEventListener('click', () => {
    itemElement.remove();
    calculateOrderTotal();
  });
  
  calculateOrderTotal();
  document.getElementById('productQuantity').value = 1;
}

// Calcular total do pedido
function calculateOrderTotal() {
  const items = Array.from(document.querySelectorAll('[name="items"]')).map(item => 
    JSON.parse(item.value)
  );
  
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 50 ? 0 : 5; // Frete grátis para pedidos acima de R$50
  const total = subtotal + deliveryFee;
  
  document.getElementById('orderTotal').value = `R$ ${total.toFixed(2)}`;
}

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Retorna todos os pedidos
 *     tags: [Pedidos]
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Termo para filtrar pedidos
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
async function loadOrders(searchTerm = '') {
  const response = await fetch(ORDERS_API_URL);
  let orders = await response.json();
  
  if (searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    orders = orders.filter(order => 
      order.clientName.toLowerCase().includes(searchTerm) || 
      order.id.toString().includes(searchTerm)
    );
  }
  
  const container = document.getElementById('ordersContainer');
  container.innerHTML = '';
  
  orders.forEach(order => {
    const orderElement = document.createElement('div');
    orderElement.className = 'list-group-item list-group-item-action';
    orderElement.innerHTML = `
      <div class="d-flex w-100 justify-content-between">
        <h5 class="mb-1">Pedido #${order.id}</h5>
        <small class="text-${getStatusColor(order.status)}">${order.status}</small>
      </div>
      <p class="mb-1">${order.clientName}</p>
      <small>${new Date(order.date).toLocaleString()} - Total: R$ ${order.total.toFixed(2)}</small>
      <button class="btn btn-sm btn-outline-danger float-end btnDeleteOrder" data-id="${order.id}">Excluir</button>
      <button class="btn btn-sm btn-outline-warning float-end me-2 btnEditOrder" data-id="${order.id}">Editar</button>
    `;
    container.appendChild(orderElement);
  });
  
  document.querySelectorAll('.btnEditOrder').forEach(btn => {
    btn.addEventListener('click', (e) => editOrder(e.target.dataset.id));
  });
  
  document.querySelectorAll('.btnDeleteOrder').forEach(btn => {
    btn.addEventListener('click', (e) => deleteOrder(e.target.dataset.id));
  });
}

function getStatusColor(status) {
  const statusColors = {
    'Recebido': 'primary',
    'Em Preparo': 'warning',
    'Saiu para Entrega': 'info',
    'Entregue': 'success',
    'Cancelado': 'danger'
  };
  return statusColors[status] || 'secondary';
}

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Retorna um pedido específico
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Detalhes do pedido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Pedido não encontrado
 */
async function editOrder(orderId) {
  const response = await fetch(`${ORDERS_API_URL}/${orderId}`);
  const order = await response.json();
  
  document.getElementById('orderId').value = order.id;
  document.getElementById('orderNotes').value = order.notes;
  document.getElementById('orderStatus').value = order.status;
  
  // Preencher itens
  const itemsContainer = document.getElementById('orderItems');
  itemsContainer.innerHTML = '';
  order.items.forEach(item => {
    addOrderItem(item.productId, item.name, item.price, item.quantity);
  });
  
  // Mostrar formulário
  document.getElementById('orderForm').classList.remove('d-none');
  document.getElementById('orderListSection').classList.add('d-none');
}

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Remove um pedido
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Pedido removido com sucesso
 *       404:
 *         description: Pedido não encontrado
 */
async function deleteOrder(orderId) {
  if (!confirm('Tem certeza que deseja excluir este pedido?')) return;
  
  await fetch(`${ORDERS_API_URL}/${orderId}`, { method: 'DELETE' });
  alert('Pedido excluído com sucesso!');
  loadOrders();
}

// Eventos de navegação
document.getElementById('btnNewClient').addEventListener('click', () => {
  document.getElementById('clientForm').classList.remove('d-none');
  document.getElementById('clientListSection').classList.add('d-none');
  document.getElementById('cepForm').classList.add('d-none');
  document.getElementById('orderSection').classList.add('d-none');
  document.getElementById('menuSection').classList.add('d-none');
  document.getElementById('clientId').value = '';
});

document.getElementById('btnClientList').addEventListener('click', () => {
  loadClients();
  document.getElementById('clientListSection').classList.remove('d-none');
  document.getElementById('clientForm').classList.add('d-none');
  document.getElementById('cepForm').classList.add('d-none');
  document.getElementById('orderSection').classList.add('d-none');
  document.getElementById('menuSection').classList.add('d-none');
});

document.getElementById('btnProducts').addEventListener('click', () => {
  document.getElementById('menuSection').classList.toggle('d-none');
  document.getElementById('clientListSection').classList.add('d-none');
  document.getElementById('clientForm').classList.add('d-none');
  document.getElementById('cepForm').classList.add('d-none');
  document.getElementById('orderSection').classList.add('d-none');
});

document.getElementById('btnOrderList').addEventListener('click', () => {
  document.getElementById('orderSection').classList.remove('d-none');
  document.getElementById('orderListSection').classList.remove('d-none');
  document.getElementById('orderForm').classList.add('d-none');
  document.getElementById('clientListSection').classList.add('d-none');
  document.getElementById('clientForm').classList.add('d-none');
  document.getElementById('cepForm').classList.add('d-none');
  document.getElementById('menuSection').classList.add('d-none');
  loadOrders();
});

// Eventos de clientes
document.getElementById('clientSelect').addEventListener('change', async function() {
  const selectedValue = this.value;
  if (!selectedValue) return;
  
  try {
    const selectedClient = JSON.parse(selectedValue);
    
    // Mostrar botões
    document.getElementById('btnWhatsApp').classList.remove('d-none');
    document.getElementById('btnEditClient').classList.remove('d-none');
    document.getElementById('btnDeleteClient').classList.remove('d-none');
    
    // Mostrar mapa apenas se tiver endereço completo
    if (selectedClient.address && selectedClient.neighborhood && selectedClient.city) {
      const address = `${selectedClient.address}, ${selectedClient.neighborhood}, ${selectedClient.city}`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      
      if (data.length > 0) {
        document.getElementById('map').classList.remove('d-none');
        initMap();
        map.setView([data[0].lat, data[0].lon], 15);
        
        // Limpar marcadores antigos
        map.eachLayer(layer => {
          if (layer instanceof L.Marker) {
            map.removeLayer(layer);
          }
        });
        
        // Adicionar novo marcador
        L.marker([data[0].lat, data[0].lon])
          .addTo(map)
          .bindPopup(`<b>${selectedClient.name}</b><br>${address}`)
          .openPopup();
      }
    }
  } catch (error) {
    console.error('Erro ao carregar cliente:', error);
  }
});

document.getElementById('btnWhatsApp').addEventListener('click', () => {
  const selectedClient = JSON.parse(document.getElementById('clientSelect').value);
  window.open(`https://wa.me/${selectedClient.phone.replace(/\D/g, '')}`, '_blank');
});

document.getElementById('btnEditClient').addEventListener('click', () => {
  const selectedClient = JSON.parse(document.getElementById('clientSelect').value);
  document.getElementById('clientId').value = selectedClient.id;
  document.getElementById('name').value = selectedClient.name;
  document.getElementById('phone').value = selectedClient.phone;
  document.getElementById('cepClient').value = selectedClient.cep;
  document.getElementById('address').value = selectedClient.address;
  document.getElementById('neighborhood').value = selectedClient.neighborhood;
  document.getElementById('city').value = selectedClient.city;
  document.getElementById('state').value = selectedClient.state;
  document.getElementById('clientForm').classList.remove('d-none');
});

/**
 * @swagger
 * /clients/{id}:
 *   delete:
 *     summary: Remove um cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Cliente removido com sucesso
 *       404:
 *         description: Cliente não encontrado
 */
document.getElementById('btnDeleteClient').addEventListener('click', async () => {
  const selectedClient = JSON.parse(document.getElementById('clientSelect').value);
  await fetch(`${API_URL}/${selectedClient.id}`, { method: 'DELETE' });
  alert('Cliente excluído!');
  loadClients();
});

/**
 * @swagger
 * /clients:
 *   post:
 *     summary: Cria ou atualiza um cliente
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       200:
 *         description: Cliente salvo com sucesso
 *       400:
 *         description: Dados inválidos
 */
document.getElementById('clientForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const client = {
    id: document.getElementById('clientId').value || Date.now().toString(),
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
      await fetch(`${API_URL}/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
      });
      alert('Cliente atualizado com sucesso!');
    } else {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
      });
      alert('Cliente criado com sucesso!');
    }

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

document.getElementById('btnCancel').addEventListener('click', () => {
  document.getElementById('clientForm').classList.add('d-none');
  document.getElementById('clientForm').reset();
});

// Eventos de pedidos
document.getElementById('btnNewOrder').addEventListener('click', async () => {
  const response = await fetch(API_URL);
  const clients = await response.json();
  const select = document.getElementById('orderClient');
  select.innerHTML = '';
  clients.forEach(client => {
    const option = document.createElement('option');
    option.value = JSON.stringify(client);
    option.textContent = `${client.name} - ${client.phone}`;
    select.appendChild(option);
  });
  
  await loadProducts();
  document.getElementById('orderForm').reset();
  document.getElementById('orderItems').innerHTML = '';
  document.getElementById('orderId').value = '';
  document.getElementById('orderForm').classList.remove('d-none');
  document.getElementById('orderListSection').classList.add('d-none');
});

document.getElementById('btnViewOrders').addEventListener('click', () => {
  loadOrders();
  document.getElementById('orderListSection').classList.remove('d-none');
  document.getElementById('orderForm').classList.add('d-none');
});

document.getElementById('btnCancelOrder').addEventListener('click', () => {
  document.getElementById('orderForm').reset();
  document.getElementById('orderForm').classList.add('d-none');
  document.getElementById('orderItems').innerHTML = '';
});

document.getElementById('orderSearch').addEventListener('input', (e) => {
  loadOrders(e.target.value);
});

document.getElementById('btnAddItem').addEventListener('click', () => {
  const productId = document.getElementById('productSelect').value;
  const quantity = parseInt(document.getElementById('productQuantity').value);
  
  if (!productId || quantity < 1) {
    alert('Selecione um produto e uma quantidade válida!');
    return;
  }
  
  const productSelect = document.getElementById('productSelect');
  const selectedOption = productSelect.options[productSelect.selectedIndex];
  const productName = selectedOption.text.split(' - ')[0];
  const productPrice = parseFloat(selectedOption.dataset.price);
  
  addOrderItem(productId, productName, productPrice, quantity);
});

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Cria ou atualiza um pedido
 *     tags: [Pedidos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       200:
 *         description: Pedido salvo com sucesso
 *       400:
 *         description: Dados inválidos
 */
document.getElementById('orderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const clientSelect = document.getElementById('orderClient');
  const selectedClient = JSON.parse(clientSelect.value);
  
  const items = Array.from(document.querySelectorAll('[name="items"]')).map(item => 
    JSON.parse(item.value)
  );
  
  if (items.length === 0) {
    alert('Adicione pelo menos um item ao pedido!');
    return;
  }
  
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 50 ? 0 : 5;
  const total = subtotal + deliveryFee;
  
  const order = {
    id: document.getElementById('orderId').value || Date.now().toString(),
    clientId: selectedClient.id,
    clientName: selectedClient.name,
    items: items,
    notes: document.getElementById('orderNotes').value,
    status: document.getElementById('orderStatus').value,
    subtotal: subtotal,
    deliveryFee: deliveryFee,
    total: total,
    date: new Date().toISOString()
  };
  
  try {
    if (order.id && order.id !== Date.now().toString()) {
      await fetch(`${ORDERS_API_URL}/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      alert('Pedido atualizado com sucesso!');
    } else {
      await fetch(ORDERS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      alert('Pedido criado com sucesso!');
    }
    
    document.getElementById('orderForm').reset();
    document.getElementById('orderForm').classList.add('d-none');
    document.getElementById('orderItems').innerHTML = '';
    loadOrders();
  } catch (error) {
    alert('Erro ao salvar pedido: ' + error.message);
  }
});

// Eventos do cardápio
$(document).on('click', '.add-to-order', function() {
  const name = $(this).data('name');
  const price = parseFloat($(this).data('price'));

  currentOrder.push({ name, price });
  updateOrderSummary();
  alert(`✅ ${name} foi adicionado ao pedido!`);
});

$(document).on('click', '.remove-item', function() {
  const index = $(this).data('index');
  currentOrder.splice(index, 1);
  updateOrderSummary();
});

/**
 * @swagger
 * /orders/finalize:
 *   post:
 *     summary: Finaliza o pedido atual
 *     tags: [Pedidos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       200:
 *         description: Pedido finalizado com sucesso
 *       400:
 *         description: Pedido vazio ou inválido
 */
$(document).on('click', '#finalizeOrder', async function() {
  if (currentOrder.length === 0) {
    alert('O pedido está vazio!');
    return;
  }

  const total = currentOrder.reduce((sum, item) => sum + item.price, 0);
  const newOrder = {
    id: Date.now(),
    items: currentOrder,
    total: total,
    status: 'Recebido',
    date: new Date().toISOString()
  };

  try {
    const response = await fetch(ORDERS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    });

    if (response.ok) {
      alert('✅ Pedido finalizado e salvo com sucesso!');
      currentOrder = [];
      updateOrderSummary();
    } else {
      alert('Erro ao salvar o pedido.');
    }
  } catch (error) {
    console.error(error);
    alert('Erro ao conectar com a API.');
  }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateOrderSummary();
  
  // Criar o resumo do pedido se não existir
  if (!document.getElementById('orderSummary')) {
    const orderSummary = document.createElement('div');
    orderSummary.id = 'orderSummary';
    orderSummary.className = 'container mt-4';
    orderSummary.innerHTML = `
      <h3>🛒 Meu Pedido</h3>
      <div><p>Nenhum item no pedido.</p></div>
    `;
    document.body.appendChild(orderSummary);
  }
});