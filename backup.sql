-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: 100mxley
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `order`
--

DROP TABLE IF EXISTS `order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order` (
  `id` varchar(191) NOT NULL,
  `storeId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `externalId` varchar(191) NOT NULL,
  `buyerName` varchar(191) NOT NULL,
  `buyerEmail` varchar(191) NOT NULL,
  `address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`address`)),
  `products` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`products`)),
  `courier` varchar(191) DEFAULT NULL,
  `trackingCode` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL,
  `exported` tinyint(1) NOT NULL DEFAULT 0,
  `notified` tinyint(1) NOT NULL DEFAULT 0,
  `totalAmount` double NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Order_storeId_externalId_key` (`storeId`,`externalId`),
  KEY `Order_userId_fkey` (`userId`),
  CONSTRAINT `Order_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order`
--

LOCK TABLES `order` WRITE;
/*!40000 ALTER TABLE `order` DISABLE KEYS */;
INSERT INTO `order` VALUES ('cmo79zwx90004ogkoeoagx6ki','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10000','Valentina Gómez','valentina@gmail.com','{\"street\":\"Av. Santa Fe 1234\",\"city\":\"CABA\",\"province\":\"CABA\",\"zip\":\"1000\"}','[{\"sku\":\"CAM-NEG-M\",\"name\":\"Camiseta negra talle M\",\"quantity\":1,\"price\":8500},{\"sku\":\"PAN-AZU-38\",\"name\":\"Pantalón azul talle 38\",\"quantity\":1,\"price\":15000}]','OCA',NULL,'paid',0,0,23500,'2026-03-23 14:14:01.577'),('cmo79zwxm0006ogkob7q9i237','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10001','Rocío Fernández','rocio@gmail.com','{\"street\":\"Belgrano 456\",\"city\":\"Rosario\",\"province\":\"Rosario\",\"zip\":\"1000\"}','[{\"sku\":\"CAM-BLA-L\",\"name\":\"Camiseta blanca talle L\",\"quantity\":1,\"price\":8500}]','Andreani',NULL,'paid',0,0,8500,'2026-03-25 14:14:01.590'),('cmo79zwy70008ogkovg2hfr4v','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10002','Camila Torres','camila@gmail.com','{\"street\":\"San Martín 789\",\"city\":\"Córdoba\",\"province\":\"Córdoba\",\"zip\":\"1000\"}','[{\"sku\":\"PAN-AZU-38\",\"name\":\"Pantalón azul talle 38\",\"quantity\":1,\"price\":15000}]','Correo Argentino',NULL,'paid',0,0,15000,'2026-03-27 14:14:01.612'),('cmo79zwye000aogkoku839yxe','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10003','Lucas Herrera','lucas@gmail.com','{\"street\":\"Rivadavia 321\",\"city\":\"Mendoza\",\"province\":\"Mendoza\",\"zip\":\"1000\"}','[{\"sku\":\"BUZ-GRI-XL\",\"name\":\"Buzo gris talle XL\",\"quantity\":1,\"price\":18000},{\"sku\":\"JKT-NEG-M\",\"name\":\"Jacket negro talle M\",\"quantity\":1,\"price\":24000}]','OCA',NULL,'paid',0,0,42000,'2026-03-29 14:14:01.620'),('cmo79zwyl000cogkoyrrgge20','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10004','Sofía Ramírez','sofia@gmail.com','{\"street\":\"Mitre 654\",\"city\":\"La Plata\",\"province\":\"La Plata\",\"zip\":\"1000\"}','[{\"sku\":\"REM-ROJ-S\",\"name\":\"Remera roja talle S\",\"quantity\":1,\"price\":7200}]','Andreani',NULL,'paid',0,0,7200,'2026-03-31 14:14:01.628'),('cmo79zwys000eogko5xuc9lwt','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10005','Matías López','matias@gmail.com','{\"street\":\"Corrientes 987\",\"city\":\"Tucumán\",\"province\":\"Tucumán\",\"zip\":\"1000\"}','[{\"sku\":\"JKT-NEG-M\",\"name\":\"Jacket negro talle M\",\"quantity\":1,\"price\":24000}]','Correo Argentino',NULL,'paid',0,0,24000,'2026-04-02 14:14:01.634'),('cmo79zwz3000gogkof844yc9w','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10006','Florencia Díaz','flor@gmail.com','{\"street\":\"Colón 123\",\"city\":\"Mar del Plata\",\"province\":\"Mar del Plata\",\"zip\":\"1000\"}','[{\"sku\":\"SHO-BLA-40\",\"name\":\"Short blanco talle 40\",\"quantity\":1,\"price\":9800},{\"sku\":\"CAM-BLA-L\",\"name\":\"Camiseta blanca talle L\",\"quantity\":1,\"price\":8500}]','OCA',NULL,'paid',0,0,18300,'2026-04-04 14:14:01.644'),('cmo79zwze000iogko30kw6ftw','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10007','Nicolás Martínez','nico@gmail.com','{\"street\":\"Libertad 456\",\"city\":\"Salta\",\"province\":\"Salta\",\"zip\":\"1000\"}','[{\"sku\":\"CAM-NEG-M\",\"name\":\"Camiseta negra talle M\",\"quantity\":1,\"price\":8500}]','Andreani',NULL,'paid',0,0,8500,'2026-04-06 14:14:01.656'),('cmo79zwzk000kogkomdzekl6x','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10008','Agustina Peralta','agus@gmail.com','{\"street\":\"San Juan 789\",\"city\":\"Neuquén\",\"province\":\"Neuquén\",\"zip\":\"1000\"}','[{\"sku\":\"CAM-BLA-L\",\"name\":\"Camiseta blanca talle L\",\"quantity\":1,\"price\":8500}]','Correo Argentino',NULL,'paid',0,0,8500,'2026-04-08 14:14:01.662'),('cmo79zwzp000mogkos279s6qu','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10009','Tomás Castillo','tomas@gmail.com','{\"street\":\"Urquiza 321\",\"city\":\"Paraná\",\"province\":\"Paraná\",\"zip\":\"1000\"}','[{\"sku\":\"PAN-AZU-38\",\"name\":\"Pantalón azul talle 38\",\"quantity\":1,\"price\":15000},{\"sku\":\"REM-ROJ-S\",\"name\":\"Remera roja talle S\",\"quantity\":1,\"price\":7200}]','OCA',NULL,'paid',0,0,22200,'2026-04-10 14:14:01.667'),('cmo79zwzv000oogkoitdp4whv','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10010','Valentina Gómez','valentina@gmail.com','{\"street\":\"Av. Santa Fe 1234\",\"city\":\"CABA\",\"province\":\"CABA\",\"zip\":\"1000\"}','[{\"sku\":\"BUZ-GRI-XL\",\"name\":\"Buzo gris talle XL\",\"quantity\":1,\"price\":18000}]','Andreani',NULL,'paid',0,0,18000,'2026-04-12 14:14:01.673'),('cmo79zx01000qogkoyod6302p','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10011','Rocío Fernández','rocio@gmail.com','{\"street\":\"Belgrano 456\",\"city\":\"Rosario\",\"province\":\"Rosario\",\"zip\":\"1000\"}','[{\"sku\":\"REM-ROJ-S\",\"name\":\"Remera roja talle S\",\"quantity\":1,\"price\":7200}]','Correo Argentino',NULL,'paid',1,0,7200,'2026-04-14 14:14:01.679'),('cmo79zx07000sogko5dtlbpx5','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10100','Lucas Herrera','lucas@gmail.com','{\"street\":\"Rivadavia 321\",\"city\":\"Mendoza\",\"province\":\"Mendoza\",\"zip\":\"2000\"}','[{\"sku\":\"CAM-BLA-L\",\"name\":\"Camiseta blanca talle L\",\"quantity\":1,\"price\":8500},{\"sku\":\"BUZ-GRI-XL\",\"name\":\"Buzo gris talle XL\",\"quantity\":1,\"price\":18000}]','OCA','OCA100000','shipped',1,1,26500,'2026-03-25 14:14:01.685'),('cmo79zx0g000uogkoqze4aevf','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10101','Sofía Ramírez','sofia@gmail.com','{\"street\":\"Mitre 654\",\"city\":\"La Plata\",\"province\":\"La Plata\",\"zip\":\"2000\"}','[{\"sku\":\"PAN-AZU-38\",\"name\":\"Pantalón azul talle 38\",\"quantity\":1,\"price\":15000}]','Andreani','AND100007','shipped',1,1,15000,'2026-03-28 14:14:01.693'),('cmo79zx0n000wogkomh2r59wv','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10102','Matías López','matias@gmail.com','{\"street\":\"Corrientes 987\",\"city\":\"Tucumán\",\"province\":\"Tucumán\",\"zip\":\"2000\"}','[{\"sku\":\"BUZ-GRI-XL\",\"name\":\"Buzo gris talle XL\",\"quantity\":1,\"price\":18000}]','Correo Argentino','CAR100014','shipped',1,1,18000,'2026-03-31 14:14:01.701'),('cmo79zx0t000yogko0596e5wn','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10103','Florencia Díaz','flor@gmail.com','{\"street\":\"Colón 123\",\"city\":\"Mar del Plata\",\"province\":\"Mar del Plata\",\"zip\":\"2000\"}','[{\"sku\":\"REM-ROJ-S\",\"name\":\"Remera roja talle S\",\"quantity\":1,\"price\":7200}]','OCA','OCA100021','shipped',1,1,7200,'2026-04-03 14:14:01.707'),('cmo79zx100010ogkoanoeup94','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10104','Nicolás Martínez','nico@gmail.com','{\"street\":\"Libertad 456\",\"city\":\"Salta\",\"province\":\"Salta\",\"zip\":\"2000\"}','[{\"sku\":\"JKT-NEG-M\",\"name\":\"Jacket negro talle M\",\"quantity\":1,\"price\":24000},{\"sku\":\"CAM-NEG-M\",\"name\":\"Camiseta negra talle M\",\"quantity\":1,\"price\":8500}]','Andreani','AND100028','shipped',1,1,32500,'2026-04-06 14:14:01.714'),('cmo79zx190012ogkouta87wgk','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10105','Agustina Peralta','agus@gmail.com','{\"street\":\"San Juan 789\",\"city\":\"Neuquén\",\"province\":\"Neuquén\",\"zip\":\"2000\"}','[{\"sku\":\"SHO-BLA-40\",\"name\":\"Short blanco talle 40\",\"quantity\":1,\"price\":9800}]','Correo Argentino','CAR100035','shipped',1,1,9800,'2026-04-09 14:14:01.723'),('cmo79zx1f0014ogkoiaj1s1qt','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10106','Tomás Castillo','tomas@gmail.com','{\"street\":\"Urquiza 321\",\"city\":\"Paraná\",\"province\":\"Paraná\",\"zip\":\"2000\"}','[{\"sku\":\"CAM-NEG-M\",\"name\":\"Camiseta negra talle M\",\"quantity\":1,\"price\":8500}]','OCA','OCA100042','shipped',1,1,8500,'2026-04-12 14:14:01.729'),('cmo79zx1l0016ogko8yzial4d','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10107','Valentina Gómez','valentina@gmail.com','{\"street\":\"Av. Santa Fe 1234\",\"city\":\"CABA\",\"province\":\"CABA\",\"zip\":\"2000\"}','[{\"sku\":\"CAM-BLA-L\",\"name\":\"Camiseta blanca talle L\",\"quantity\":1,\"price\":8500}]','Andreani','AND100049','shipped',1,1,8500,'2026-04-15 14:14:01.735'),('cmo79zx1v0018ogko83gmiz31','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10200','Matías López','matias@gmail.com','{\"street\":\"Corrientes 987\",\"city\":\"Tucumán\",\"province\":\"Tucumán\",\"zip\":\"3000\"}','[{\"sku\":\"REM-ROJ-S\",\"name\":\"Remera roja talle S\",\"quantity\":1,\"price\":7200}]','OCA',NULL,'delivered',1,1,7200,'2026-03-27 14:14:01.744'),('cmo79zx22001aogko764o36y0','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10201','Florencia Díaz','flor@gmail.com','{\"street\":\"Colón 123\",\"city\":\"Mar del Plata\",\"province\":\"Mar del Plata\",\"zip\":\"3000\"}','[{\"sku\":\"JKT-NEG-M\",\"name\":\"Jacket negro talle M\",\"quantity\":1,\"price\":24000}]','Andreani',NULL,'delivered',1,1,24000,'2026-03-31 14:14:01.753'),('cmo79zx29001cogkoficueqp7','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10202','Nicolás Martínez','nico@gmail.com','{\"street\":\"Libertad 456\",\"city\":\"Salta\",\"province\":\"Salta\",\"zip\":\"3000\"}','[{\"sku\":\"SHO-BLA-40\",\"name\":\"Short blanco talle 40\",\"quantity\":1,\"price\":9800}]','Correo Argentino',NULL,'delivered',1,1,9800,'2026-04-04 14:14:01.759'),('cmo79zx2f001eogko3qiwa9m5','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10203','Agustina Peralta','agus@gmail.com','{\"street\":\"San Juan 789\",\"city\":\"Neuquén\",\"province\":\"Neuquén\",\"zip\":\"3000\"}','[{\"sku\":\"CAM-NEG-M\",\"name\":\"Camiseta negra talle M\",\"quantity\":1,\"price\":8500}]','OCA',NULL,'delivered',1,1,8500,'2026-04-08 14:14:01.765'),('cmo79zx2j001gogkohlzohw3l','cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','TN10204','Tomás Castillo','tomas@gmail.com','{\"street\":\"Urquiza 321\",\"city\":\"Paraná\",\"province\":\"Paraná\",\"zip\":\"3000\"}','[{\"sku\":\"CAM-BLA-L\",\"name\":\"Camiseta blanca talle L\",\"quantity\":1,\"price\":8500}]','Andreani',NULL,'delivered',1,1,8500,'2026-04-12 14:14:01.770');
/*!40000 ALTER TABLE `order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `store`
--

DROP TABLE IF EXISTS `store`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `store` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `platform` varchar(191) NOT NULL,
  `storeId` varchar(191) NOT NULL,
  `storeName` varchar(191) NOT NULL,
  `accessToken` varchar(191) NOT NULL,
  `domain` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Store_platform_storeId_key` (`platform`,`storeId`),
  KEY `Store_userId_fkey` (`userId`),
  CONSTRAINT `Store_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store`
--

LOCK TABLES `store` WRITE;
/*!40000 ALTER TABLE `store` DISABLE KEYS */;
INSERT INTO `store` VALUES ('cmo79zwwy0002ogkocdfr6zwb','cmo79zwvj0000ogkoclggoco6','tiendanube','123456','Indumentaria Mxley','demo_token_tiendanube','mxley.mitiendanube.com','2026-04-20 14:14:01.568');
/*!40000 ALTER TABLE `store` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transaction`
--

DROP TABLE IF EXISTS `transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `transaction` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `amount` double NOT NULL,
  `description` varchar(191) NOT NULL,
  `reference` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `Transaction_userId_fkey` (`userId`),
  CONSTRAINT `Transaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction`
--

LOCK TABLES `transaction` WRITE;
/*!40000 ALTER TABLE `transaction` DISABLE KEYS */;
INSERT INTO `transaction` VALUES ('cmo79zx2q001iogkoexsv4sed','cmo79zwvj0000ogkoclggoco6','credit',20,'Créditos de bienvenida',NULL,'2026-02-19 14:14:01.776'),('cmo79zx2z001kogkoj6zv854h','cmo79zwvj0000ogkoclggoco6','credit',200,'Recarga MercadoPago - MP123456','MP123456','2026-03-21 14:14:01.785'),('cmo79zx39001mogkozwq8lyq6','cmo79zwvj0000ogkoclggoco6','debit',-1,'Exportación de rótulos - Pedido #TN10000','cmo79zwx90004ogkoeoagx6ki','2026-03-26 14:14:01.796'),('cmo79zx3e001oogkotkkzxby9','cmo79zwvj0000ogkoclggoco6','debit',-1,'Exportación de rótulos - Pedido #TN10001','cmo79zwxm0006ogkob7q9i237','2026-03-27 14:14:01.801'),('cmo79zx3j001qogkohzxv1zuj','cmo79zwvj0000ogkoclggoco6','debit',-1,'Exportación de rótulos - Pedido #TN10002','cmo79zwy70008ogkovg2hfr4v','2026-03-28 14:14:01.805'),('cmo79zx3q001sogkonfwow5eu','cmo79zwvj0000ogkoclggoco6','debit',-1,'Exportación de rótulos - Pedido #TN10003','cmo79zwye000aogkoku839yxe','2026-03-29 14:14:01.812'),('cmo79zx3v001uogko6pr24few','cmo79zwvj0000ogkoclggoco6','debit',-1,'Exportación de rótulos - Pedido #TN10004','cmo79zwyl000cogkoyrrgge20','2026-03-30 14:14:01.817'),('cmo79zx41001wogkopu3svuxw','cmo79zwvj0000ogkoclggoco6','debit',-1,'Exportación de rótulos - Pedido #TN10005','cmo79zwys000eogko5xuc9lwt','2026-03-31 14:14:01.824'),('cmo79zx46001yogkoqxdxdxzh','cmo79zwvj0000ogkoclggoco6','debit',-1,'Exportación de rótulos - Pedido #TN10006','cmo79zwz3000gogkof844yc9w','2026-04-01 14:14:01.828'),('cmo79zx4c0020ogko4srbfhtl','cmo79zwvj0000ogkoclggoco6','debit',-1,'Exportación de rótulos - Pedido #TN10007','cmo79zwze000iogko30kw6ftw','2026-04-02 14:14:01.834'),('cmo79zx4k0022ogkovhgttx5z','cmo79zwvj0000ogkoclggoco6','debit',-1,'Exportación de rótulos - Pedido #TN10008','cmo79zwzk000kogkomdzekl6x','2026-04-03 14:14:01.842'),('cmo79zx4r0024ogkofwb2mljt','cmo79zwvj0000ogkoclggoco6','debit',-1,'Exportación de rótulos - Pedido #TN10009','cmo79zwzp000mogkos279s6qu','2026-04-04 14:14:01.849'),('cmo79zx4v0026ogkoxufda9hz','cmo79zwvj0000ogkoclggoco6','debit',-1,'Exportación de rótulos - Pedido #TN10010','cmo79zwzv000oogkoitdp4whv','2026-04-05 14:14:01.854'),('cmo79zx520028ogkoqnb6j1lt','cmo79zwvj0000ogkoclggoco6','debit',-1,'Exportación de rótulos - Pedido #TN10011','cmo79zx01000qogkoyod6302p','2026-04-06 14:14:01.860'),('cmo79zx56002aogko0150e567','cmo79zwvj0000ogkoclggoco6','debit',-1,'Exportación de rótulos - Pedido #TN10100','cmo79zx07000sogko5dtlbpx5','2026-04-07 14:14:01.865'),('cmo79zx5b002cogkowyqhp20r','cmo79zwvj0000ogkoclggoco6','debit',-1,'Exportación de rótulos - Pedido #TN10101','cmo79zx0g000uogkoqze4aevf','2026-04-08 14:14:01.870'),('cmo79zx5h002eogkoghumnnzz','cmo79zwvj0000ogkoclggoco6','debit',-1,'Exportación de rótulos - Pedido #TN10102','cmo79zx0n000wogkomh2r59wv','2026-04-09 14:14:01.875'),('cmo79zx5o002gogkoiqgnt1rg','cmo79zwvj0000ogkoclggoco6','debit',-0.5,'Seguimiento automático - Pedido #TN10100','cmo79zx07000sogko5dtlbpx5','2026-03-31 14:14:01.882'),('cmo79zx5u002iogko6rpdlxh0','cmo79zwvj0000ogkoclggoco6','debit',-0.5,'Seguimiento automático - Pedido #TN10101','cmo79zx0g000uogkoqze4aevf','2026-04-01 14:14:01.888'),('cmo79zx62002kogkorxcs1bkv','cmo79zwvj0000ogkoclggoco6','debit',-0.5,'Seguimiento automático - Pedido #TN10102','cmo79zx0n000wogkomh2r59wv','2026-04-02 14:14:01.897'),('cmo79zx67002mogko91bwkfni','cmo79zwvj0000ogkoclggoco6','debit',-0.5,'Seguimiento automático - Pedido #TN10103','cmo79zx0t000yogko0596e5wn','2026-04-03 14:14:01.901'),('cmo79zx6d002oogkoztdlrpg8','cmo79zwvj0000ogkoclggoco6','debit',-0.5,'Seguimiento automático - Pedido #TN10104','cmo79zx100010ogkoanoeup94','2026-04-04 14:14:01.907'),('cmo79zx6k002qogkodb517leb','cmo79zwvj0000ogkoclggoco6','debit',-0.5,'Seguimiento automático - Pedido #TN10105','cmo79zx190012ogkouta87wgk','2026-04-05 14:14:01.914'),('cmo79zx6t002sogkoq82i1zwg','cmo79zwvj0000ogkoclggoco6','debit',-0.5,'Seguimiento automático - Pedido #TN10106','cmo79zx1f0014ogkoiaj1s1qt','2026-04-06 14:14:01.923'),('cmo79zx72002uogkoup4whwgb','cmo79zwvj0000ogkoclggoco6','debit',-0.5,'Seguimiento automático - Pedido #TN10107','cmo79zx1l0016ogko8yzial4d','2026-04-07 14:14:01.932'),('cmo7b9fue0001ogvw2o79wq5a','cmo79zwvj0000ogkoclggoco6','debit',3,'Exportación de 3 rótulo(s)',NULL,'2026-04-20 14:49:25.568'),('cmo7bwj6s0003ogvwitsxyz8m','cmo79zwvj0000ogkoclggoco6','debit',2,'Exportación de 2 rótulo(s)',NULL,'2026-04-20 15:07:23.028'),('cmo7c6uie0005ogvwao5nwtfu','cmo79zwvj0000ogkoclggoco6','debit',1,'Exportación de 1 rótulo(s)',NULL,'2026-04-20 15:15:24.277');
/*!40000 ALTER TABLE `transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `credits` double NOT NULL DEFAULT 20,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('cmo79zwvj0000ogkoclggoco6','demo@100mxley.com','Ezequiel','$2b$10$OvvVqFOsFGGAlMKJB1/tsexJNgF76cppA2kCs8uqMYghBoQwCp2Mu',187,'2026-04-20 14:14:01.516');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-20 14:04:28
