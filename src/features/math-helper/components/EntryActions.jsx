import { Camera, FileText } from 'lucide-react';
import Button from '../../../shared/components/Button';

export default function EntryActions() {
    const handleScanWorksheet = () => {
        console.log('[Math Helper] Scan Worksheet button clicked.');
    };

    const handleUploadPDF = () => {
        console.log('[Math Helper] Upload PDF button clicked.');
    };

    return (
        <div className="flex flex-col gap-3 mt-auto">
            {/* Scan Worksheet Button (Filled Primary style) */}
            <Button
                variant="primary"
                size="lg"
                icon={Camera}
                onClick={handleScanWorksheet}
                className="shadow-md"
            >
                Scan Worksheet
            </Button>

            {/* Upload PDF Button (Outline/Secondary style) */}
            <Button
                variant="secondary"
                size="lg"
                icon={FileText}
                onClick={handleUploadPDF}
            >
                Upload PDF
            </Button>
        </div>
    );
}
