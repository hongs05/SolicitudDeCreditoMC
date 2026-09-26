-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "familiaId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEn" DATETIME NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revocadoEn" DATETIME,
    "reemplazadoPorId" INTEGER,
    CONSTRAINT "RefreshToken_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RefreshToken_reemplazadoPorId_fkey" FOREIGN KEY ("reemplazadoPorId") REFERENCES "RefreshToken" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TipoEmpleo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Banco" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Solicitud" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "estado" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "fechaNacimiento" TEXT NOT NULL,
    "tipoEmpleoId" INTEGER NOT NULL,
    "empresa" TEXT NOT NULL,
    "antiguedadAnios" INTEGER NOT NULL,
    "ingresoMensual" DECIMAL NOT NULL,
    "montoSolicitado" DECIMAL NOT NULL,
    "cantidadCuotas" INTEGER NOT NULL,
    "tasaAnual" DECIMAL NOT NULL,
    "periodicidad" TEXT NOT NULL,
    "observaciones" TEXT,
    "dictaminadaPorId" INTEGER,
    "dictaminadaEn" DATETIME,
    "creadaPorId" INTEGER NOT NULL,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" DATETIME NOT NULL,
    CONSTRAINT "Solicitud_tipoEmpleoId_fkey" FOREIGN KEY ("tipoEmpleoId") REFERENCES "TipoEmpleo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Solicitud_dictaminadaPorId_fkey" FOREIGN KEY ("dictaminadaPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Solicitud_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Credito" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "secuencia" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "monto" DECIMAL NOT NULL,
    "tasaAnual" DECIMAL NOT NULL,
    "periodicidad" TEXT NOT NULL,
    "plazo" INTEGER NOT NULL,
    "cuotaNivelada" DECIMAL NOT NULL,
    "fechaBase" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Credito_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cuota" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "creditoId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "fechaVencimiento" TEXT NOT NULL,
    "capital" DECIMAL NOT NULL,
    "interes" DECIMAL NOT NULL,
    "valorCuota" DECIMAL NOT NULL,
    "saldoRestante" DECIMAL NOT NULL,
    CONSTRAINT "Cuota_creditoId_fkey" FOREIGN KEY ("creditoId") REFERENCES "Credito" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Desembolso" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "creditoId" INTEGER NOT NULL,
    "bancoId" INTEGER NOT NULL,
    "numeroCuenta" TEXT NOT NULL,
    "ejecutadoPorId" INTEGER NOT NULL,
    "ejecutadoEn" DATETIME NOT NULL,
    CONSTRAINT "Desembolso_creditoId_fkey" FOREIGN KEY ("creditoId") REFERENCES "Credito" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Desembolso_bancoId_fkey" FOREIGN KEY ("bancoId") REFERENCES "Banco" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Desembolso_ejecutadoPorId_fkey" FOREIGN KEY ("ejecutadoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_reemplazadoPorId_key" ON "RefreshToken"("reemplazadoPorId");

-- CreateIndex
CREATE INDEX "RefreshToken_familiaId_idx" ON "RefreshToken"("familiaId");

-- CreateIndex
CREATE UNIQUE INDEX "TipoEmpleo_codigo_key" ON "TipoEmpleo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Banco_codigo_key" ON "Banco"("codigo");

-- CreateIndex
CREATE INDEX "Solicitud_estado_idx" ON "Solicitud"("estado");

-- CreateIndex
CREATE INDEX "Solicitud_cedula_idx" ON "Solicitud"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Credito_secuencia_key" ON "Credito"("secuencia");

-- CreateIndex
CREATE UNIQUE INDEX "Credito_numero_key" ON "Credito"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Credito_solicitudId_key" ON "Credito"("solicitudId");

-- CreateIndex
CREATE UNIQUE INDEX "Cuota_creditoId_numero_key" ON "Cuota"("creditoId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Desembolso_creditoId_key" ON "Desembolso"("creditoId");
