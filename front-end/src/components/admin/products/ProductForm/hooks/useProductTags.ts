import { KeyboardEvent } from 'react';
import { ProductFormData } from '../types';

/**
 * Hook quản lý tags cho sản phẩm
 */
export const useProductTags = (
  formData: ProductFormData,
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>
) => {
  /**
   * Xử lý thêm tag mới khi nhấn Enter hoặc dấu phẩy
   */
  const handleTagsChange = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();

      const target = e.target as HTMLInputElement;
      const value = target.value.trim();

      if (value && formData.tags && Array.isArray(formData.tags) && !formData.tags.includes(value)) {
        setFormData(prev => ({
          ...prev,
          tags: [...(prev.tags || []), value]
        }));
        target.value = '';
      } else if (value) {
        setFormData(prev => ({
          ...prev,
          tags: [value]
        }));
        target.value = '';
      }
    }
  };

  /**
   * Xóa một tag khỏi danh sách
   */
  const removeTag = (tagToRemove: string) => {
    if (!formData.tags || !Array.isArray(formData.tags)) return;

    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }));
  };

  /**
   * Xử lý thêm từ khóa SEO
   */
  const handleSeoKeywordsChange = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();

      const target = e.target as HTMLInputElement;
      const value = target.value.trim();

      if (value && formData.seo) {
        const currentKeywords = (formData.seo.keywords || []);

        if (!currentKeywords.includes(value)) {
          setFormData(prev => {
            // Đảm bảo seo tồn tại
            const prevSeo = prev.seo || {
              metaTitle: '',
              metaDescription: '',
              keywords: []
            };

            return {
              ...prev,
              seo: {
                ...prevSeo,
                keywords: [...currentKeywords, value]
              }
            };
          });
        }
        target.value = '';
      }
    }
  };

  /**
   * Xóa một từ khóa SEO
   */
  const removeSeoKeyword = (index: number) => {
    if (!formData.seo || !Array.isArray(formData.seo.keywords)) return;

    setFormData(prev => {
      // Đảm bảo seo tồn tại
      const prevSeo = prev.seo || {
        metaTitle: '',
        metaDescription: '',
        keywords: []
      };

      return {
        ...prev,
        seo: {
          ...prevSeo,
          keywords: (prevSeo.keywords || []).filter((_, i) => i !== index)
        }
      };
    });
  };

  /**
   * Xử lý thêm vấn đề da (cập nhật để hỗ trợ cả array và event)
   */
  const handleConcernsChange = (concernsOrEvent: string[] | KeyboardEvent<HTMLInputElement>) => {
    // Nếu là mảng concerns mới
    if (Array.isArray(concernsOrEvent)) {
      setFormData(prev => ({
        ...prev,
        cosmetic_info: {
          ...prev.cosmetic_info,
          concerns: concernsOrEvent
        }
      }));
      return;
    }

    // Nếu là sự kiện keyboard
    const e = concernsOrEvent;
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();

      const target = e.target as HTMLInputElement;
      const value = target.value.trim();

      if (value && formData.cosmetic_info) {
        const currentConcerns = formData.cosmetic_info.concerns || [];

        if (!currentConcerns.includes(value)) {
          setFormData(prev => ({
            ...prev,
            cosmetic_info: {
              ...prev.cosmetic_info,
              concerns: [...currentConcerns, value]
            }
          }));
        }
        target.value = '';
      }
    }
  };

  /**
   * Xóa một vấn đề da
   */
  const removeConcern = (index: number) => {
    if (!formData.cosmetic_info || !Array.isArray(formData.cosmetic_info.concerns)) return;

    const updatedConcerns = [...formData.cosmetic_info.concerns];
    updatedConcerns.splice(index, 1);

    setFormData(prev => ({
      ...prev,
      cosmetic_info: {
        ...prev.cosmetic_info,
        concerns: updatedConcerns
      }
    }));
  };

  /**
   * Xử lý thêm thành phần
   */
  const handleIngredientsChange = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();

      const target = e.target as HTMLInputElement;
      const value = target.value.trim();

      if (value && formData.cosmetic_info) {
        const currentIngredients = formData.cosmetic_info.ingredients || [];

        if (!currentIngredients.includes(value)) {
          setFormData(prev => ({
            ...prev,
            cosmetic_info: {
              ...prev.cosmetic_info,
              ingredients: [...currentIngredients, value]
            }
          }));
        }
        target.value = '';
      }
    }
  };

  /**
   * Xóa một thành phần
   */
  const removeIngredient = (index: number) => {
    if (!formData.cosmetic_info || !Array.isArray(formData.cosmetic_info.ingredients)) return;

    const updatedIngredients = [...formData.cosmetic_info.ingredients];
    updatedIngredients.splice(index, 1);

    setFormData(prev => ({
      ...prev,
      cosmetic_info: {
        ...prev.cosmetic_info,
        ingredients: updatedIngredients
      }
    }));
  };

  return {
    handleTagsChange,
    removeTag,
    handleSeoKeywordsChange,
    removeSeoKeyword,
    handleConcernsChange,
    removeConcern,
    handleIngredientsChange,
    removeIngredient
  };
};

export default useProductTags;
