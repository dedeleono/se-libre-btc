const { PrismaClient } = require('@prisma/client');
const { PaymentStatus, SubscriptionStatus, SubscriptionPeriod, AcademicStatus } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Create academic years
  console.log("Creating academic years...");
  const previousYear = await prisma.academicYear.create({
    data: {
      name: "2024",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-12-31T23:59:59Z"),
      isActive: false
    }
  });

  const currentYear = await prisma.academicYear.create({
    data: {
      name: "2025",
      startDate: new Date("2025-01-01T00:00:00Z"),
      endDate: new Date("2025-12-31T23:59:59Z"),
      isActive: true
    }
  });

  const nextYear = await prisma.academicYear.create({
    data: {
      name: "2026",
      startDate: new Date("2026-01-01T00:00:00Z"),
      endDate: new Date("2026-12-31T23:59:59Z"),
      isActive: false
    }
  });
  
  console.log("Academic years created:", {
    previousYear: previousYear.name,
    currentYear: currentYear.name,
    nextYear: nextYear.name
  });

  // Student ID and level ID from existing seed
  const studentId = '70897eb9-769f-4124-b0de-67f61cdfc1ac';
  const levelId = '43c17c07-548b-4cd3-9920-93bb1458415e';
  const studentEmail = 'saberverestudiantes@gmail.com';

  // PREVIOUS ACADEMIC YEAR
  console.log("Setting up previous academic year records...");
  
  // Payment for previous year inscription fee
  const previousYearInscriptionPayment = await prisma.payment.create({
    data: {
      amount: 2000,
      status: PaymentStatus.COMPLETED,
      paymentMethod: 'BANK_TRANSFER',
      userEmail: studentEmail,
      levelId: levelId,
      metadata: {
        paymentType: 'INSCRIPTION',
        academicYear: previousYear.name,
        seededAt: new Date().toISOString()
      }
    }
  });
  
  // Previous academic year record - COMPLETED with final grade
  const previousAcademicYear = await prisma.studentAcademicYear.create({
    data: {
      studentId: studentId,
      academicYearId: previousYear.id,
      levelId: levelId,
      status: AcademicStatus.COMPLETED,
      isPaid: true,
      finalGrade: 92.3, // Good grades in previous year
      paymentId: previousYearInscriptionPayment.id
    }
  });

  // CURRENT ACADEMIC YEAR
  console.log("Setting up current academic year records...");
  
  // Payment for current year inscription
  const currentYearInscriptionPayment = await prisma.payment.create({
    data: {
      amount: 2200, // Slight increase in fees
      status: PaymentStatus.COMPLETED,
      paymentMethod: 'BANK_TRANSFER',
      userEmail: studentEmail,
      levelId: levelId,
      metadata: {
        paymentType: 'INSCRIPTION',
        academicYear: currentYear.name,
        seededAt: new Date().toISOString()
      }
    }
  });
  
  // Current academic year record - ACTIVE
  const currentAcademicYear = await prisma.studentAcademicYear.create({
    data: {
      studentId: studentId,
      academicYearId: currentYear.id,
      levelId: levelId, // Same level ID as the previous year, could be a new level if student advanced
      status: AcademicStatus.ACTIVE,
      isPaid: true,
      finalGrade: 87.5, // Current grade average so far
      paymentId: currentYearInscriptionPayment.id
    }
  });

  // Monthly payments for current year (instead of subscription)
  console.log("Creating monthly payments for current year...");
  
  // Create 3 monthly payments that have been made so far
  const monthlyPayments = [];
  for (let i = 0; i < 3; i++) {
    const paymentDate = new Date();
    paymentDate.setMonth(paymentDate.getMonth() - (2 - i)); // Payments for the last 3 months
    
    const monthlyPayment = await prisma.payment.create({
      data: {
        amount: 1500,
        status: PaymentStatus.COMPLETED,
        paymentMethod: 'BANK_TRANSFER',
        paymentDate: paymentDate,
        userEmail: studentEmail,
        levelId: levelId,
        metadata: {
          paymentType: 'MONTHLY_FEE',
          month: paymentDate.getMonth() + 1, // 1-12 format
          year: paymentDate.getFullYear(),
          academicYear: currentYear.name,
          seededAt: new Date().toISOString()
        }
      }
    });
    
    monthlyPayments.push(monthlyPayment);
  }

  console.log(`Created ${monthlyPayments.length} monthly payments`);
  console.log("Setup complete for academic years:", {
    previous: {
      year: previousYear.name, 
      status: previousAcademicYear.status,
      finalGrade: previousAcademicYear.finalGrade
    },
    current: {
      year: currentYear.name, 
      status: currentAcademicYear.status,
      currentGrade: currentAcademicYear.finalGrade
    }
  });

  // ADD ADDITIONAL STUDENTS
  console.log("Adding additional students...");

  // Define existing level IDs (as shown in the image)
  const levelIds = {
    primeroPrimaria: '43c17c07-548b-4cd3-9920-93bb1458415e', // Segundo Primaria in the image
    terceroPrimaria: '5b09b78a-6fef-4088-9db9-213c319d7a64',
    cuartoPrimaria: 'c690dea4-2af3-42e3-91ac-c6ab239d6e56',
    quintoPrimaria: '882efdd0-e7d4-45f0-8a63-97440c8d2486',
    sextoPrimaria: '7480e854-b100-452d-aa91-72f5a3cc114a',
    primeroBásico: 'b07d611e-c08b-4fb1-848b-b5aa8660ccd6',
    segundoBásico: 'e2985bc7-20b9-4fbb-841c-4e7b559a1d62',
    terceroBásico: '9ce4782f-10b5-4a15-845d-a3b2355e6669',
    primeroBásicoMadurez: '2b93c01f-d2b4-4761-b662-1f64adfe692a',
    bachilleratoMadurez: '3aa726cc-11fd-4d67-9012-949b403bc5e1'
  };

  // Additional students data
  const additionalStudents = [
    {
      name: "Juan Pérez",
      email: "juan@example.com",
      firstName: "Juan",
      lastName: "Pérez",
      levelId: levelIds.primeroPrimaria,
      previousYearGrade: 91.5,
      currentYearGrade: 88.2,
      paymentStatus: "ALL_PAID",
      carnet: `2025-001-${Date.now()}-1`
    },
    {
      name: "María López",
      email: "maria@example.com",
      firstName: "María",
      lastName: "López",
      levelId: levelIds.terceroPrimaria,
      previousYearGrade: 85.3,
      currentYearGrade: 82.7,
      paymentStatus: "MISSING_LAST_MONTH",
      carnet: `2025-002-${Date.now()}-2`
    },
    {
      name: "Carlos Ruiz",
      email: "carlos@example.com",
      firstName: "Carlos",
      lastName: "Ruiz",
      levelId: levelIds.quintoPrimaria,
      previousYearGrade: 78.9,
      currentYearGrade: 81.4,
      paymentStatus: "PAYMENT_PENDING",
      carnet: `2025-003-${Date.now()}-3`
    },
    {
      name: "Ana Torres",
      email: "ana@example.com",
      firstName: "Ana",
      lastName: "Torres",
      levelId: levelIds.segundoBásico,
      previousYearGrade: 94.7,
      currentYearGrade: 95.2,
      paymentStatus: "ALL_PAID",
      carnet: `2025-004-${Date.now()}-4`
    },
    {
      name: "Diego Soto",
      email: "diego@example.com",
      firstName: "Diego",
      lastName: "Soto",
      levelId: levelIds.terceroBásico,
      previousYearGrade: 73.8,
      currentYearGrade: null, // Failed previous year, not enrolled in current
      paymentStatus: "NOT_ENROLLED",
      carnet: `2025-005-${Date.now()}-5`
    }
  ];

  // Create the additional students
  for (const studentData of additionalStudents) {
    console.log(`Creating student: ${studentData.name}`);
    
    // Check if student already exists by email or carnet
    let student = await prisma.user.findFirst({
      where: {
        OR: [
          { email: studentData.email },
          { carnet: studentData.carnet }
        ]
      }
    });
    
    if (!student) {
      // Create student only if they don't already exist
      student = await prisma.user.create({
        data: {
          name: studentData.name,
          email: studentData.email,
          role: "STUDENT",
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          levelId: studentData.levelId,
          onboardingCompleted: true,
          carnet: studentData.carnet
        }
      });
    } else {
      console.log(`Student ${studentData.name} already exists, skipping creation.`);
    }
    
    // PREVIOUS ACADEMIC YEAR for additional student
    if (studentData.previousYearGrade) {
      // Check if previous academic year record already exists
      const existingPrevYear = await prisma.studentAcademicYear.findFirst({
        where: {
          studentId: student.id,
          academicYearId: previousYear.id
        }
      });
      
      if (!existingPrevYear) {
        // Payment for previous year inscription fee
        const prevYearInscriptionPayment = await prisma.payment.create({
          data: {
            amount: 2000,
            status: PaymentStatus.COMPLETED,
            paymentMethod: 'BANK_TRANSFER',
            userEmail: student.email,
            levelId: studentData.levelId,
            metadata: {
              paymentType: 'INSCRIPTION',
              academicYear: previousYear.name,
              seededAt: new Date().toISOString()
            }
          }
        });
        
        // Academic year record
        const status = studentData.previousYearGrade >= 75 ? AcademicStatus.COMPLETED : AcademicStatus.FAILED;
        
        await prisma.studentAcademicYear.create({
          data: {
            studentId: student.id,
            academicYearId: previousYear.id,
            levelId: studentData.levelId,
            status: status,
            isPaid: true,
            finalGrade: studentData.previousYearGrade,
            paymentId: prevYearInscriptionPayment.id
          }
        });
        
        // Monthly payments for previous year
        for (let i = 0; i < 10; i++) { // 10 months of payments
          const paymentDate = new Date(2024, i, 15); // 15th of each month in 2024
          
          await prisma.payment.create({
            data: {
              amount: 1500,
              status: PaymentStatus.COMPLETED,
              paymentMethod: 'BANK_TRANSFER',
              paymentDate: paymentDate,
              userEmail: student.email,
              levelId: studentData.levelId,
              metadata: {
                paymentType: 'MONTHLY_FEE',
                month: paymentDate.getMonth() + 1,
                year: paymentDate.getFullYear(),
                academicYear: previousYear.name,
                seededAt: new Date().toISOString()
              }
            }
          });
        }
      } else {
        console.log(`Previous academic year record for ${studentData.name} already exists, skipping.`);
      }
    }
    
    // CURRENT ACADEMIC YEAR for additional student
    if (studentData.paymentStatus !== "NOT_ENROLLED" && studentData.currentYearGrade !== null) {
      // Check if current academic year record already exists
      const existingCurrYear = await prisma.studentAcademicYear.findFirst({
        where: {
          studentId: student.id,
          academicYearId: currentYear.id
        }
      });
      
      if (!existingCurrYear) {
        // Payment status based on the student's payment status
        const paymentStatus = 
          studentData.paymentStatus === "ALL_PAID" || 
          studentData.paymentStatus === "MISSING_LAST_MONTH" ? 
          PaymentStatus.COMPLETED : PaymentStatus.PENDING;
        
        // Current year inscription payment
        const currYearInscriptionPayment = await prisma.payment.create({
          data: {
            amount: 2200,
            status: paymentStatus,
            paymentMethod: paymentStatus === PaymentStatus.COMPLETED ? 'BANK_TRANSFER' : undefined,
            userEmail: student.email,
            levelId: studentData.levelId,
            metadata: {
              paymentType: 'INSCRIPTION',
              academicYear: currentYear.name,
              seededAt: new Date().toISOString()
            }
          }
        });
        
        // Current academic year record
        await prisma.studentAcademicYear.create({
          data: {
            studentId: student.id,
            academicYearId: currentYear.id,
            levelId: studentData.levelId,
            status: AcademicStatus.ACTIVE,
            isPaid: paymentStatus === PaymentStatus.COMPLETED,
            finalGrade: studentData.currentYearGrade,
            paymentId: currYearInscriptionPayment.id
          }
        });
        
        // Create monthly payments for current year
        const currentMonth = new Date().getMonth();
        
        // Determine how many months to create payments for based on payment status
        let monthsToCreate = currentMonth + 1;
        if (studentData.paymentStatus === "MISSING_LAST_MONTH") {
          monthsToCreate -= 1; // Skip the last month
        } else if (studentData.paymentStatus === "PAYMENT_PENDING") {
          monthsToCreate -= 2; // Skip the last two months
        }
        
        // Create completed monthly payments
        for (let i = 0; i < monthsToCreate; i++) {
          const paymentDate = new Date(2025, i, 15); // 15th of each month in 2025
          
          await prisma.payment.create({
            data: {
              amount: 1500,
              status: PaymentStatus.COMPLETED,
              paymentMethod: 'BANK_TRANSFER',
              paymentDate: paymentDate,
              userEmail: student.email,
              levelId: studentData.levelId,
              metadata: {
                paymentType: 'MONTHLY_FEE',
                month: paymentDate.getMonth() + 1,
                year: paymentDate.getFullYear(),
                academicYear: currentYear.name,
                seededAt: new Date().toISOString()
              }
            }
          });
        }
        
        // Create pending payment for students with missing last month
        if (studentData.paymentStatus === "MISSING_LAST_MONTH") {
          const pendingPaymentDate = new Date(2025, currentMonth, 15);
          
          await prisma.payment.create({
            data: {
              amount: 1500,
              status: PaymentStatus.PENDING,
              paymentDate: pendingPaymentDate,
              userEmail: student.email,
              levelId: studentData.levelId,
              metadata: {
                paymentType: 'MONTHLY_FEE',
                month: pendingPaymentDate.getMonth() + 1,
                year: pendingPaymentDate.getFullYear(),
                academicYear: currentYear.name,
                seededAt: new Date().toISOString()
              }
            }
          });
        }
        
        // Create pending payments for students with payment issues
        if (studentData.paymentStatus === "PAYMENT_PENDING") {
          for (let i = currentMonth - 1; i <= currentMonth; i++) {
            const pendingPaymentDate = new Date(2025, i, 15);
            
            await prisma.payment.create({
              data: {
                amount: 1500,
                status: PaymentStatus.PENDING,
                paymentDate: pendingPaymentDate,
                userEmail: student.email,
                levelId: studentData.levelId,
                metadata: {
                  paymentType: 'MONTHLY_FEE',
                  month: pendingPaymentDate.getMonth() + 1,
                  year: pendingPaymentDate.getFullYear(),
                  academicYear: currentYear.name,
                  seededAt: new Date().toISOString()
                }
              }
            });
          }
        }
      } else {
        console.log(`Current academic year record for ${studentData.name} already exists, skipping.`);
      }
    }
  }

  console.log("Additional students created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 