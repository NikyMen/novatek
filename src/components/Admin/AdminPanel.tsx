import React, { useState, useEffect } from 'react';
import { Plus, Package, LogOut, Tag, TrendingUp, Settings, Star, X } from 'lucide-react';
import { ProductForm } from './ProductForm';
import { ProductList } from './ProductList';
import { CategoryForm } from './CategoryForm';
import { CategoryList } from './CategoryList';
import { AdminLogin } from './AdminLogin';
import { Notification } from '../Notification';
import { useNotification } from '../../hooks/useNotification';
import type { Product, Category } from '../../types';

export const AdminPanel: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  
  const { notification, showSuccess, showError, hideNotification } = useNotification();

  useEffect(() => {
    // Verificar si ya está autenticado
    const authStatus = localStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      loadProducts();
      loadCategories();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
      loadCategories();
    }
  }, [isAuthenticated]);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const handleCreateProduct = async (productData: any) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        await loadProducts();
        setShowProductForm(false);
        showSuccess('Producto creado exitosamente');
      } else {
        const error = await response.json();
        showError(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error al crear producto:', error);
      showError('Error al crear el producto');
    }
  };

  const handleUpdateProduct = async (productData: any) => {
    if (!editingProduct) return;

    console.log('Datos a actualizar:', productData);
    console.log('ID del producto:', editingProduct.id);

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const updatedProduct = await response.json();
        console.log('Producto actualizado:', updatedProduct);
        await loadProducts();
        setEditingProduct(null);
        setShowProductForm(false);
        showSuccess('Producto actualizado exitosamente');
      } else {
        const error = await response.json();
        console.error('Error del servidor:', error);
        showError(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      showError('Error al actualizar el producto');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadProducts();
        showSuccess('Producto eliminado exitosamente');
      } else {
        const error = await response.json();
        showError(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      showError('Error al eliminar el producto');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
  };

  const handleCloseForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleCloseView = () => {
    setViewingProduct(null);
  };

  // Funciones para categorías
  const handleCreateCategory = async (categoryData: any) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });

      if (response.ok) {
        await loadCategories();
        setShowCategoryForm(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error al crear categoría:', error);
      alert('Error al crear la categoría');
    }
  };

  const handleUpdateCategory = async (categoryData: any) => {
    if (!editingCategory) return;

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });

      if (response.ok) {
        await loadCategories();
        setEditingCategory(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      alert('Error al actualizar la categoría');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleCloseCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
  };

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('admin_authenticated', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al autenticar:', error);
      return false;
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
  };

  const stats = {
    totalProducts: products.length,
    totalCategories: categories.length,
    totalValue: products.reduce((sum, product) => sum + product.price, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestiona la repuestera Repuestos Mendez
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {activeTab === 'products' ? (
                <button
                  onClick={() => setShowProductForm(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center space-x-2"
                >
                  <Plus size={20} />
                  <span>Nuevo Producto</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowCategoryForm(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center space-x-2"
                >
                  <Plus size={20} />
                  <span>Nueva Categoría</span>
                </button>
              )}
              <a
                href="/admin/analytics"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center space-x-2"
              >
                <TrendingUp size={20} />
                <span>Analíticas</span>
              </a>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center space-x-2"
              >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="h-5 w-5 inline mr-2" />
                Productos
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'categories'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Tag className="h-5 w-5 inline mr-2" />
                Categorías
              </button>
            </nav>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Productos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalProducts}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Tag className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Categorías
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalCategories}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Settings className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Valor Total
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${stats.totalValue.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'products' ? (
          <ProductList
            products={products}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onView={handleViewProduct}
          />
        ) : (
          <CategoryList
            onEdit={handleEditCategory}
            onDelete={() => {}}
            onCreate={() => setShowCategoryForm(true)}
          />
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          product={editingProduct || undefined}
          onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
          onCancel={handleCloseForm}
          categories={categories.map(cat => cat.name)}
        />
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <CategoryForm
          category={editingCategory || undefined}
          onSave={editingCategory ? handleUpdateCategory : handleCreateCategory}
          onClose={handleCloseCategoryForm}
        />
      )}

      {/* Product View Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {viewingProduct.name}
                </h2>
                <button
                  onClick={handleCloseView}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Descripción:</h3>
                  <p className="text-gray-600">{viewingProduct.description}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700">Categoría:</h3>
                  <p className="text-gray-600">{viewingProduct.category}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700">Precio:</h3>
                  <p className="text-gray-600">${viewingProduct.price}</p>
                </div>
                
                {viewingProduct.featured && (
                  <div className="flex items-center space-x-2 text-yellow-600">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="font-medium">Producto Destacado</span>
                  </div>
                )}
                
                {viewingProduct.image && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Imagen:</h3>
                    <img
                      src={viewingProduct.image}
                      alt={viewingProduct.name}
                      className="w-full max-w-md h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
};
