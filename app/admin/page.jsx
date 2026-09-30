'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('cadastrar')
  
  const [editingId, setEditingId] = useState(null)
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('Natura')
  const [category, setCategory] = useState('Perfumes')
  const [customCategory, setCustomCategory] = useState('')
  const [size, setSize] = useState('')
  const [price, setPrice] = useState('')
  const [stockQuantity, setStockQuantity] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isPromoted, setIsPromoted] = useState(false) // Novo campo para ofertas
  
  const [products, setProducts] = useState([])
  const [filterBrand, setFilterBrand] = useState('Todas')
  const [filterCategory, setFilterCategory] = useState('Todas')
  
  const categoriesList = ['Perfumes', 'Hidratantes', 'Skin Care', 'Corpo e Banho', 'Maquiagem']
  const brandsList = ['Natura', 'Avon', 'O Boticário', 'Outra']

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (data) setProducts(data)
  }

  async function handleSaveProduct(e) {
    e.preventDefault()
    const finalCategory = category === 'Nova Categoria' ? customCategory : category

    if (!name || !price || !stockQuantity) {
      alert('Preencha os campos obrigatórios (Nome, Preço e Qtd).')
      return
    }

    const productData = {
      name,
      brand,
      category: finalCategory,
      size: size || null,
      price: parseFloat(price),
      stock_quantity: parseInt(stockQuantity),
      image_url: imageUrl || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500',
      is_promoted: isPromoted,
      is_active: true
    }

    if (editingId) {
      const { error } = await supabase.from('products').update(productData).eq('id', editingId)
      if (!error) {
        alert('Produto atualizado com sucesso!')
        resetForm()
        fetchProducts()
      }
    } else {
      const { error } = await supabase.from('products').insert([productData])
      if (!error) {
        alert('Produto cadastrado com sucesso!')
        resetForm()
        fetchProducts()
      }
    }
  }

  function startEditing(prod) {
    setEditingId(prod.id)
    setName(prod.name)
    setBrand(prod.brand)
    setCategory(prod.category)
    setSize(prod.size || '')
    setPrice(prod.price)
    setStockQuantity(prod.stock_quantity)
    setImageUrl(prod.image_url || '')
    setIsPromoted(prod.is_promoted || false)
    setActiveTab('cadastrar')
  }

  function resetForm() {
    setEditingId(null)
    setName('')
    setSize('')
    setPrice('')
    setStockQuantity('')
    setImageUrl('')
    setIsPromoted(false)
    setCustomCategory('')
  }

  async function updateStock(id, currentStock, change) {
    const newStock = Math.max(0, currentStock + change)
    const { error } = await supabase.from('products').update({ stock_quantity: newStock }).eq('id', id)
    if (!error) fetchProducts()
  }

  const filteredStockProducts = products.filter(prod => {
    const matchesBrand = filterBrand === 'Todas' || prod.brand === filterBrand
    const matchesCategory = filterCategory === 'Todas' || prod.category === filterCategory
    return matchesBrand && matchesCategory
  })

  return (
    <main className="min-h-screen bg-gray-100 text-gray-800 pb-24">
      <header className="bg-gradient-to-r from-pink-600 to-rose-500 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">Kátia Cosméticos</h1>
            <p className="text-xs text-pink-100">Painel Administrativo</p>
          </div>
          <a href="/" className="bg-pink-700 hover:bg-pink-800 text-xs px-3 py-1.5 rounded-lg shadow transition">
            Ver Lojinha 🛍️
          </a>
        </div>

        <div className="max-w-md mx-auto flex gap-2 mt-4">
          <button
            onClick={() => { resetForm(); setActiveTab('cadastrar'); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'cadastrar' ? 'bg-white text-pink-600 shadow' : 'bg-pink-700/50 text-white'
            }`}
          >
            {editingId ? '✏️ Editando' : '➕ Cadastrar'}
          </button>
          <button
            onClick={() => setActiveTab('estoque')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'estoque' ? 'bg-white text-pink-600 shadow' : 'bg-pink-700/50 text-white'
            }`}
          >
            📦 Estoque ({products.length})
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4">
        {activeTab === 'cadastrar' && (
          <form onSubmit={handleSaveProduct} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-sm font-bold text-gray-800">
                {editingId ? 'Editar Produto' : 'Novo Item no Catálogo'}
              </h2>
              {editingId && (
                <button type="button" onClick={resetForm} className="text-[10px] text-red-500 underline font-semibold">
                  Cancelar
                </button>
              )}
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-600">Nome do Produto *</label>
              <input
                type="text"
                placeholder="Ex: Deo Colônia Luna"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 p-2 text-xs border rounded-lg outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2 items-start">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">Marca</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full p-2 text-xs border rounded-lg bg-white outline-none"
                >
                  {brandsList.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">Litragem / Gramatura</label>
                <input
                  type="text"
                  placeholder="Ex: 100ml / 250g"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full p-2 text-xs border rounded-lg outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-600">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full mt-1 p-2 text-xs border rounded-lg bg-white outline-none"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="Nova Categoria">➕ Adicionar nova categoria...</option>
              </select>
            </div>

            {category === 'Nova Categoria' && (
              <div>
                <label className="text-[11px] font-semibold text-pink-600">Nova Categoria</label>
                <input
                  type="text"
                  placeholder="Ex: Infantil..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full mt-1 p-2 text-xs border border-pink-400 rounded-lg outline-none bg-pink-50"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-gray-600">Preço (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full mt-1 p-2 text-xs border rounded-lg outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600">Qtd. no Estoque *</label>
                <input
                  type="number"
                  placeholder="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full mt-1 p-2 text-xs border rounded-lg outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-600">Foto do Produto (Link)</label>
              <input
                type="text"
                placeholder="Cole o link da imagem..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full mt-1 p-2 text-xs border rounded-lg outline-none"
              />
            </div>

            {/* Checkbox de Produto em Oferta */}
            <div className="flex items-center gap-2 bg-pink-50 p-2.5 rounded-lg border border-pink-200">
              <input
                type="checkbox"
                id="promoted"
                checked={isPromoted}
                onChange={(e) => setIsPromoted(e.target.checked)}
                className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
              />
              <label htmlFor="promoted" className="text-xs font-semibold text-pink-800 cursor-pointer">
                🔥 Destacar este produto na secção de Ofertas (Início)
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2.5 rounded-lg text-xs transition shadow-md mt-2"
            >
              {editingId ? 'Salvar Alterações' : 'Salvar Produto no Catálogo'}
            </button>
          </form>
        )}

        {activeTab === 'estoque' && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Gestão Manual de Estoque</h2>

            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 grid grid-cols-2 gap-2">
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
            </div>
            
            {filteredStockProducts.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">Nenhum produto encontrado.</p>
            ) : (
              filteredStockProducts.map((prod) => (
                <div key={prod.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={prod.image_url} alt={prod.name} className="w-12 h-12 object-cover rounded-lg bg-gray-100" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{prod.name}</h4>
                          {prod.is_promoted && <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded font-bold">Oferta</span>}
                        </div>
                        <p className="text-[10px] text-gray-500">{prod.brand} {prod.size && `• ${prod.size}`}</p>
                        <span className="text-xs font-bold text-pink-600">R$ {Number(prod.price).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${prod.stock_quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        Qtd: {prod.stock_quantity}
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        <button onClick={() => updateStock(prod.id, prod.stock_quantity, -1)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 w-6 h-6 rounded flex items-center justify-center text-xs font-bold">-</button>
                        <button onClick={() => updateStock(prod.id, prod.stock_quantity, 1)} className="bg-pink-100 hover:bg-pink-200 text-pink-700 w-6 h-6 rounded flex items-center justify-center text-xs font-bold">+</button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end border-t pt-2 mt-1">
                    <button
                      onClick={() => startEditing(prod)}
                      className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md font-semibold transition flex items-center gap-1"
                    >
                      ✏️ Editar Dados do Produto
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  )
}