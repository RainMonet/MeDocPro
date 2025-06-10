import { useState, useEffect } from 'react';
import { templatesApi } from '@/services/api';

export const useTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTemplates = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await templatesApi.getTemplates(params);
      setTemplates(data.templates || data || []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await templatesApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const createTemplate = async (templateData) => {
    try {
      const newTemplate = await templatesApi.createTemplate(templateData);
      setTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateTemplate = async (id, templateData) => {
    try {
      const updatedTemplate = await templatesApi.updateTemplate(id, templateData);
      setTemplates(prev => 
        prev.map(template => 
          template.id === id ? updatedTemplate : template
        )
      );
      return updatedTemplate;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTemplate = async (id) => {
    try {
      await templatesApi.deleteTemplate(id);
      setTemplates(prev => prev.filter(template => template.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, []);

  return {
    templates,
    categories,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates
  };
};

