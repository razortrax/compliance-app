"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PenTool, RotateCcw, Save, X } from "lucide-react";

interface DigitalSignatureProps {
  cafId: string;
  signatureType: "COMPLETION" | "APPROVAL";
  staffId: string;
  staffName: string;
  onSignatureComplete: (signatureData: {
    digitalSignature: string;
    signedBy: string;
    notes?: string;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function DigitalSignature({
  cafId,
  signatureType,
  staffId,
  staffName,
  onSignatureComplete,
  onCancel,
  isSubmitting = false,
}: DigitalSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureNotes, setSignatureNotes] = useState("");
  const [acknowledgedName, setAcknowledgedName] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set up canvas
    canvas.width = 600;
    canvas.height = 200;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Clear canvas with white background
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Touch events for mobile
  const startTouchDrawing = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const touchDraw = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopTouchDrawing = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    // Validate that user acknowledged their name
    if (acknowledgedName.toLowerCase() !== staffName.toLowerCase()) {
      alert("Please type your full name exactly as shown to confirm your signature.");
      return;
    }

    // Convert canvas to base64 data URL
    const signatureDataURL = canvas.toDataURL("image/png");

    const signatureData = {
      digitalSignature: signatureDataURL,
      signedBy: staffName,
      notes: signatureNotes.trim() || undefined,
    };

    onSignatureComplete(signatureData);
  };

  const getSignatureTypeLabel = () => {
    switch (signatureType) {
      case "COMPLETION":
        return "Supervisor Completion Signature";
      case "APPROVAL":
        return "Final Approval Signature";
      default:
        return "Digital Signature";
    }
  };

  const getInstructions = () => {
    switch (signatureType) {
      case "COMPLETION":
        return "By signing below, I certify that the corrective actions described in this CAF have been completed satisfactorily and in accordance with applicable regulations.";
      case "APPROVAL":
        return "By signing below, I approve the completion of this corrective action form and certify that all requirements have been met.";
      default:
        return "Please provide your digital signature below.";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            {getSignatureTypeLabel()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instructions */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 leading-relaxed">{getInstructions()}</p>
          </div>

          {/* Name Confirmation */}
          <div className="space-y-2">
            <Label htmlFor="acknowledgedName">
              Type your full name to confirm: <span className="font-semibold">{staffName}</span>
            </Label>
            <Input
              id="acknowledgedName"
              value={acknowledgedName}
              onChange={(e) => setAcknowledgedName(e.target.value)}
              placeholder={`Type "${staffName}" to confirm`}
              className={
                acknowledgedName.toLowerCase() === staffName.toLowerCase() ? "border-green-500" : ""
              }
            />
            {acknowledgedName && acknowledgedName.toLowerCase() !== staffName.toLowerCase() && (
              <p className="text-sm text-red-600">Name must match exactly: {staffName}</p>
            )}
          </div>

          {/* Signature Canvas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Digital Signature</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSignature}
                disabled={!hasSignature}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>

            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                className="block cursor-crosshair touch-none"
                style={{ width: "100%", height: "200px" }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startTouchDrawing}
                onTouchMove={touchDraw}
                onTouchEnd={stopTouchDrawing}
              />
            </div>

            <p className="text-xs text-gray-600">
              Draw your signature in the box above using your mouse or touch device.
            </p>
          </div>

          {/* Optional Notes */}
          <div className="space-y-2">
            <Label htmlFor="signatureNotes">Additional Notes (Optional)</Label>
            <Textarea
              id="signatureNotes"
              value={signatureNotes}
              onChange={(e) => setSignatureNotes(e.target.value)}
              placeholder="Any additional comments or notes about this signature..."
              rows={3}
            />
          </div>

          {/* Timestamp Info */}
          <div className="p-3 bg-gray-50 rounded border text-sm text-gray-600">
            <p>
              <strong>Signature Date/Time:</strong> {new Date().toLocaleString()}
            </p>
            <p>
              <strong>IP Address:</strong> Will be recorded for audit trail
            </p>
            <p>
              <strong>CAF ID:</strong> {cafId}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={
            !hasSignature ||
            acknowledgedName.toLowerCase() !== staffName.toLowerCase() ||
            isSubmitting
          }
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="h-4 w-4 mr-1" />
          {isSubmitting ? "Saving..." : "Complete Signature"}
        </Button>
      </div>
    </div>
  );
}
