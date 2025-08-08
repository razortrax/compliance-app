"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Database, RefreshCw } from "lucide-react";

export function StatusCheck() {
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error">("checking");
  const [error, setError] = useState<string>("");
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkDatabase = async () => {
    setDbStatus("checking");
    try {
      const response = await fetch("/api/organizations/count");
      if (response.ok) {
        setDbStatus("connected");
        setError("");
      } else {
        setDbStatus("error");
        setError(`API Error: ${response.status}`);
      }
    } catch (err) {
      setDbStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkDatabase();
  }, []);

  const getStatusIcon = () => {
    switch (dbStatus) {
      case "checking":
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (dbStatus) {
      case "checking":
        return <Badge variant="outline">Checking...</Badge>;
      case "connected":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Connected</Badge>;
      case "error":
        return <Badge variant="destructive">Disconnected</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle className="text-lg">System Status</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>Database connectivity and API health</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm">
            {dbStatus === "connected" && "Database connected successfully"}
            {dbStatus === "checking" && "Checking database connection..."}
            {dbStatus === "error" && "Database connection failed"}
          </span>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Last checked: {lastCheck.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={checkDatabase}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
