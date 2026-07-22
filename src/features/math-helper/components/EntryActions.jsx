import { Camera, FileText } from 'lucide-react';
import Button from '../../../shared/components/Button';

export default function EntryActions({ onScanClick, onUploadPDFClick }) {
    return (
        <div className="flex flex-col gap-3 mt-auto">
            {/* Scan Worksheet Button (Filled Primary style) */}
            <Button
                variant="primary"
                size="lg"
                icon={Camera}
                onClick={onScanClick}
                className="shadow-md"
            >
                Scan Worksheet
            </Button>

            {/* Upload PDF Button (Outline/Secondary style) */}
            <Button
                variant="secondary"
                size="lg"
                icon={FileText}
                onClick={onUploadPDFClick}
            >
                Upload PDF
            </Button>
        </div>
    );
}
