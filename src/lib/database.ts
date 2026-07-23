import { neon } from '@neondatabase/serverless';
import type { Product, Category } from '../types';

import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

export { sql };

// Función para inicializar la base de datos
export async function initDatabase() {
  try {
    // Crear tabla de categorías
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Crear tabla de productos
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(255) NOT NULL,
        image TEXT,
        images TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Crear tabla de vehículos
    await sql`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        brand VARCHAR(255) NOT NULL,
        model VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT NOT NULL,
        images TEXT[],
        mileage INTEGER,
        fuel_type VARCHAR(50) NOT NULL,
        transmission VARCHAR(50) NOT NULL,
        color VARCHAR(100) NOT NULL,
        condition VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'disponible',
        features TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Insertar categorías por defecto si no existen
    const existingCategories = await sql`SELECT COUNT(*) FROM categories`;
    if (existingCategories[0].count === '0') {
      await sql`
        INSERT INTO categories (name, description) VALUES
        ('Electrónicos', 'Dispositivos electrónicos y gadgets'),
        ('Ropa', 'Ropa y accesorios de moda'),
        ('Hogar', 'Artículos para el hogar y decoración'),
        ('Deportes', 'Equipamiento deportivo y fitness'),
        ('Libros', 'Libros y material educativo')
      `;
    }

    console.log('Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
    throw error;
  }
}

export const db = {
  products: {
    getAll: async () => {
      try {
        // Obtener productos sin la columna featured primero
        const rows = await sql`
          SELECT id, name, description, category, price, image, images, created_at, updated_at 
          FROM products 
          ORDER BY created_at DESC
        `;
        
        // Intentar obtener los valores de featured por separado
        let featuredMap = new Map();
        try {
          const featuredRows = await sql`
            SELECT id, featured 
            FROM products
          `;
          featuredRows.forEach(row => {
            featuredMap.set(row.id.toString(), row.featured || false);
          });
        } catch (featuredError) {
          // Si la columna featured no existe, todos serán false
          console.log('Columna featured no existe, usando false por defecto');
        }
        
        return rows.map(row => ({
          id: row.id.toString(),
          name: row.name,
          description: row.description,
          category: row.category,
          price: parseFloat(row.price),
          image: row.image,
          images: Array.isArray(row.images) ? row.images : [],
          featured: featuredMap.get(row.id.toString()) || false,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
      } catch (error) {
        console.error('Error en getAll:', error);
        return [];
      }
    },
    
    getById: async (id: string) => {
      try {
        // Primero intentar con consulta específica sin featured
        const rows = await sql`
          SELECT id, name, description, category, price, image, images, created_at, updated_at 
          FROM products 
          WHERE id = ${id}
        `;
        
        if (rows.length === 0) return null;
        const row = rows[0];
        
        // Intentar obtener el valor de featured por separado
        let featured = false;
        try {
          const featuredResult = await sql`
            SELECT featured 
            FROM products 
            WHERE id = ${id}
          `;
          featured = featuredResult[0]?.featured || false;
        } catch (featuredError) {
          // Si la columna featured no existe, usar false por defecto
          featured = false;
        }
        
        return {
          id: row.id.toString(),
          name: row.name,
          description: row.description,
          category: row.category,
          price: parseFloat(row.price),
          image: row.image,
          images: Array.isArray(row.images) ? row.images : [],
          featured: featured,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      } catch (error) {
        console.error('Error en getById:', error);
        return null;
      }
    },

    getFeatured: async () => {
      try {
        const rows = await sql`
          SELECT id, name, description, category, price, image, images, created_at, updated_at, featured
          FROM products 
          WHERE featured = true 
          ORDER BY created_at DESC
        `;
        return rows.map(row => ({
          id: row.id.toString(),
          name: row.name,
          description: row.description,
          category: row.category,
          price: parseFloat(row.price),
          image: row.image,
          images: Array.isArray(row.images) ? row.images : [],
          featured: true,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
      } catch (error) {
        // Si la columna featured no existe, devolver array vacío
        console.log('Columna featured no existe, devolviendo array vacío');
        return [];
      }
    },
    
    create: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const result = await sql`
          INSERT INTO products (
            name, description, price, category, image, images, featured
          )
          VALUES (
            ${product.name}, ${product.description}, ${product.price}, 
            ${product.category}, ${product.image || null}, 
            ${product.images || []}, ${product.featured || false}
          )
          RETURNING *
        `;
        return result[0];
      } catch (error) {
        console.error('Error creating product:', error);
        throw error;
      }
    },

    update: async (id: string, updates: Partial<Product>) => {
      try {
        console.log('Actualizando producto ID:', id);
        console.log('Updates recibidos:', updates);
        
        // Primero obtener el producto actual
        const currentProduct = await sql`SELECT * FROM products WHERE id = ${id}`;
        
        if (currentProduct.length === 0) {
          throw new Error('Producto no encontrado');
        }
        
        // Preparar los valores actualizados
        const current = currentProduct[0];
        const updatedData = {
          name: updates.name !== undefined ? updates.name : current.name,
          description: updates.description !== undefined ? updates.description : current.description,
          price: updates.price !== undefined ? updates.price : current.price,
          category: updates.category !== undefined ? updates.category : current.category,
          image: updates.image !== undefined ? updates.image : current.image,
          images: updates.images !== undefined ? updates.images : (current.images || []), // Mantener como array
          featured: updates.featured !== undefined ? updates.featured : current.featured
        };
        
        console.log('Datos a actualizar:', updatedData);
        
        // Ejecutar la actualización
        const result = await sql`
          UPDATE products 
          SET 
            name = ${updatedData.name},
            description = ${updatedData.description},
            price = ${updatedData.price},
            category = ${updatedData.category},
            image = ${updatedData.image},
            images = ${updatedData.images},
            featured = ${updatedData.featured},
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING id, name, description, category, price, image, images, featured, created_at, updated_at
        `;
        
        console.log('Resultado de la actualización:', result);
        
        if (!result || result.length === 0) {
          throw new Error('Error al actualizar el producto');
        }
        
        const row = result[0];
        const updatedProduct = {
          id: row.id.toString(),
          name: row.name,
          description: row.description,
          category: row.category,
          price: parseFloat(row.price),
          image: row.image,
          images: Array.isArray(row.images) ? row.images : [],
          featured: row.featured || false,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
        
        console.log('Producto actualizado correctamente:', updatedProduct);
        return updatedProduct;
      } catch (error) {
        console.error('Error updating product:', error);
        throw error;
      }
    },
    
    delete: async (id: string) => {
      const rows = await sql`DELETE FROM products WHERE id = ${id} RETURNING *`;
      if (rows.length === 0) return null;
      const row = rows[0];
      return {
        id: row.id.toString(),
        name: row.name,
        description: row.description,
        category: row.category,
        price: parseFloat(row.price),
        image: row.image,
        images: Array.isArray(row.images) ? row.images : [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    },
    
    search: async (query: string) => {
      const rows = await sql`
        SELECT * FROM products 
        WHERE name ILIKE ${`%${query}%`} 
        OR description ILIKE ${`%${query}%`} 
        OR category ILIKE ${`%${query}%`}
        ORDER BY created_at DESC
      `;
      return rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        description: row.description,
        category: row.category,
        price: parseFloat(row.price),
        image: row.image,
        images: Array.isArray(row.images) ? row.images : [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    },
    
    getByCategory: async (category: string) => {
      const rows = await sql`SELECT * FROM products WHERE category = ${category} ORDER BY created_at DESC`;
      return rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        description: row.description,
        category: row.category,
        price: parseFloat(row.price),
        image: row.image,
        images: Array.isArray(row.images) ? row.images : [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    }
  },
  
  categories: {
    getAll: async () => {
      const rows = await sql`SELECT * FROM categories ORDER BY name`;
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    },
    
    getById: async (id: string) => {
      const rows = await sql`SELECT * FROM categories WHERE id = ${id}`;
      if (rows.length === 0) return null;
      const row = rows[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    },
    
    create: async (category: Omit<Category, 'id'>) => {
      const result = await sql`
        INSERT INTO categories (name, description)
        VALUES (${category.name}, ${category.description || null})
        RETURNING *
      `;
      const row = result[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    },
    
    update: async (id: string, updates: Partial<Category>) => {
      const result = await sql`
        UPDATE categories 
        SET name = ${updates.name}, 
            description = ${updates.description},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
      if (result.length === 0) return null;
      const row = result[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    },
    
    delete: async (id: string) => {
      const result = await sql`DELETE FROM categories WHERE id = ${id} RETURNING *`;
      return result.length > 0 ? result[0] : null;
    }
  }
};
