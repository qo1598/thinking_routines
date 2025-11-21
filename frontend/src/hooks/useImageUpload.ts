import { useState, useRef, ChangeEvent } from 'react';

export const useImageUpload = () => {
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setUploadedImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
            setError('');
        }
    };

    const handleCancelImage = () => {
        setUploadedImage(null);
        setImagePreview('');
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return {
        uploadedImage,
        imagePreview,
        error,
        setError,
        fileInputRef,
        handleImageUpload,
        handleCancelImage,
        triggerFileInput,
        setUploadedImage,
        setImagePreview
    };
};
