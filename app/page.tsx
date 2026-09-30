'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filtros idênticos aos do estoque
  const [filterBrand, setFilterBrand] = useState('Todas')
  const [filterCategory, setFilterCategory] = useState('Todas')
  
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Pix')

  const categoriesList = ['Perfumes', 'Hidratantes', 'Skin Care', 'Corpo e Banho', 'Maquiagem']
  const brandsList = ['Natura', 'Avon', 'O Boticário', 'Outra']

  // Gerar opções de datas para retirada (próximos 10 dias)
  const pickupDatesOptions = Array.from({ length: 10 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false })
    if (data) setProducts(data)
  }

  function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  function removeFromCart(productId) {
    const existingItem = cart.find(item => item.id === productId)
    if (existingItem.quantity > 1) {
      setCart(cart.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
    } else {
      setCart(cart.filter(item => item.id !== productId))
    }
  }

  const totalCartPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  // Finalizar pedido via WhatsApp
  async function handleCheckoutWhatsApp() {
    if (!customerName.trim()) {
      alert('Por favor, informe o seu nome para o pedido.')
      return
    }

    if (!pickupDate) {
      alert('Por favor, selecione o dia de retirada.')
      return
    }

    if (cart.length === 0) {
      alert('O seu carrinho está vazio.')
      return
    }

    const orderItemsSummary = cart.map(item => `${item.quantity}x ${item.name} ${item.size ? `(${item.size})` : ''} (R$ ${item.price})`).join('\n')
    
    // Salvar na tabela orders do Supabase
    await supabase.from('orders').insert([{
      client_name: customerName,
      client_whatsapp: '(71) 99999-9999',
      total_amount: totalCartPrice,
      items: orderItemsSummary,
      pickup_date: pickupDate,
      payment_method: paymentMethod,
      status: 'Aguardando retirada'
    }])
    
    const message = `Olá! Meu nome é *${customerName}* e gostaria de fazer o seguinte pedido na *Kátia Cosméticos*:\n\n${orderItemsSummary}\n\n*Forma de Pagamento:* ${paymentMethod}\n*Retirada Prevista:* ${pickupDate}\n*Total:* R$ ${totalCartPrice.toFixed(2)}`
    
    const encodedMessage = encodeURIComponent(message)
    const meuWhatsApp = '5571992705860'
    
    window.open(`https://api.whatsapp.com/send?phone=${meuWhatsApp}&text=${encodedMessage}`, '_blank')
  }

  // Verificar se há filtros ativos
  const hasActiveFilter = filterBrand !== 'Todas' || filterCategory !== 'Todas' || searchTerm.trim() !== ''

  // Filtragem de produtos para o catálogo geral
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.brand.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBrand = filterBrand === 'Todas' || product.brand === filterBrand
    const matchesCategory = filterCategory === 'Todas' || product.category === filterCategory
    return matchesSearch && matchesBrand && matchesCategory
  })

  // Produtos em oferta (destacados pelo admin e sem filtros ativos)
  const promotedProducts = products.filter(p => p.is_promoted)

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 pb-24">
      {/* Topo / Header da Loja */}
      <header className="bg-gradient-to-r from-pink-600 to-rose-500 text-white p-4 shadow-md sticky top-0 z-40">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold tracking-wide">Kátia Cosméticos</h1>
            <p className="text-[11px] text-pink-100">Perfumes, Cuidados & Beleza</p>
          </div>
          <a href="/admin" className="bg-pink-700 hover:bg-pink-800 text-[11px] px-3 py-1.5 rounded-lg shadow transition">
            Admin ⚙️
          </a>
        </div>

        {/* Barra de Pesquisa */}
        <div className="max-w-md mx-auto mt-3">
          <input
            type="text"
            placeholder="Buscar produtos, marcas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2.5 rounded-lg text-gray-900 bg-white placeholder-gray-400 text-xs shadow-inner outline-none"
          />
        </div>
      </header>

      {/* Filtros em Cascata (Marca e Categoria) */}
      <section className="max-w-md mx-auto p-3 bg-white border-b shadow-xs grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 block mb-1">Filtrar Marca</label>
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="w-full p-1.5 text-xs border rounded-lg bg-gray-50 outline-none"
          >
            <option value="Todas">Todas as Marcas</option>
            {brandsList.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-gray-500 block mb-1">Filtrar Categoria</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full p-1.5 text-xs border rounded-lg bg-gray-50 outline-none"
          >
            <option value="Todas">Todas as Categorias</option>
            {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </section>

      {/* SECÇÃO DE OFERTAS EM DESTAQUE (SOME SE HOUVER FILTRO) */}
      {!hasActiveFilter && promotedProducts.length > 0 && (
        <section className="max-w-md mx-auto p-4 bg-pink-50/50 border-b">
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="text-base">🔥</span>
            <h3 className="font-extrabold text-xs text-pink-700 uppercase tracking-wider">Itens Promocionais em Destaque</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {promotedProducts.map(product => (
              <div key={product.id} className="min-w-[140px] max-w-[140px] bg-white p-2.5 rounded-xl shadow-sm border border-pink-100 flex flex-col justify-between">
                <div>
                  <div className="h-24 rounded-lg mb-2 overflow-hidden relative bg-gray-100">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                      Oferta
                    </span>
                  </div>
                  <h4 className="text-[11px] font-bold text-gray-800 line-clamp-1">{product.name}</h4>
                  <p className="text-[9px] text-gray-400">{product.brand} {product.size && `• ${product.size}`}</p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-pink-600">R$ {Number(product.price).toFixed(2)}</span>
                  <button onClick={() => addToCart(product)} className="bg-pink-600 hover:bg-pink-700 text-white px-2 py-1 rounded text-[10px] font-semibold">
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CATÁLOGO GERAL */}
      <section className="max-w-md mx-auto p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wider">
            {hasActiveFilter ? 'Resultados da Busca / Filtro' : 'Catálogo Completo'}
          </h3>
          <span className="text-[11px] text-gray-400">{filteredProducts.length} itens</span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-xs text-gray-500">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="bg-gray-100 h-32 rounded-lg mb-2 overflow-hidden relative">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold">
                      {product.brand}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{product.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {product.size ? product.size : product.category}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-pink-600">R$ {Number(product.price).toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition shadow-xs"
                  >
                    + Comprar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* BARRA INFERIOR / CARRINHO */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center max-w-md mx-auto z-40 shadow-lg">
        <div className="flex flex-col items-center text-pink-600 cursor-pointer">
          <span className="text-xs font-bold">Início</span>
        </div>
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-full text-xs font-bold shadow-md transition flex items-center gap-2"
        >
          🛒 Ver Carrinho
          {totalItemsCount > 0 && (
            <span className="bg-white text-pink-600 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
              {totalItemsCount}
            </span>
          )}
        </button>
      </nav>

      {/* MODAL DO CARRINHO */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end max-w-md mx-auto">
          <div className="bg-white rounded-t-2xl p-4 max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-gray-800">Seu Carrinho de Compras</h3>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold px-2 py-1">
                ✕ Fechar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {cart.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">O seu carrinho está vazio.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border">
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">{item.name}</h4>
                      <p className="text-[10px] text-gray-500">R$ {Number(item.price).toFixed(2)} {item.size && `• ${item.size}`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 bg-gray-200 rounded text-xs font-bold flex items-center justify-center">-</button>
                      <span className="text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="w-6 h-6 bg-pink-100 text-pink-700 rounded text-xs font-bold flex items-center justify-center">+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t pt-3 space-y-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">Seu Nome *</label>
                  <input
                    type="text"
                    placeholder="Digite seu nome..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2 text-xs border rounded-lg outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">Dia de Retirada *</label>
                    <select
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full p-2 text-xs border rounded-lg bg-white outline-none"
                    >
                      <option value="">Selecione o dia...</option>
                      {pickupDatesOptions.map(date => <option key={date} value={date}>{date}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">Forma de Pagamento *</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-2 text-xs border rounded-lg bg-white outline-none"
                    >
                      <option value="Pix">Pix</option>
                      <option value="Dinheiro">Dinheiro na Retirada</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center font-bold text-sm pt-1">
                  <span>Total Geral:</span>
                  <span className="text-pink-600">R$ {totalCartPrice.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleCheckoutWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
                >
                  📲 Enviar Pedido via WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}